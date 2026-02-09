'use client';
import { useState, useRef } from 'react';
import { api } from '../lib/api';

/**
 * Componente PhotoUpload
 * Subida de fotos con arrastrar y soltar
 */
export default function PhotoUpload({ eventSlug, onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState(null);
    const [uploaderName, setUploaderName] = useState('');
    const fileInputRef = useRef(null);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = async (files) => {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            setError('Por favor seleccioná archivos de imagen (JPEG, PNG, GIF, WebP)');
            return;
        }

        if (imageFiles.length > 5) {
            setError('Máximo 5 fotos por subida');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            imageFiles.forEach(file => {
                formData.append('photos', file);
            });
            if (uploaderName.trim()) {
                formData.append('uploaderName', uploaderName.trim());
            }

            const result = await api.uploadPhotos(eventSlug, formData);

            if (onUploadComplete) {
                onUploadComplete(result.photos);
            }

            // Show warning if some photos were rejected
            if (result.rejectedPhotos && result.rejectedPhotos.length > 0) {
                setError(`⚠️ ${result.rejectedPhotos.length} foto(s) rechazada(s) por contenido inapropiado`);
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-section fade-in">
            <div className="form-group">
                <label className="form-label">Tu nombre (opcional)</label>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Anónimo"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                />
            </div>

            <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                {uploading ? (
                    <>
                        <div className="spinner"></div>
                        <p>Subiendo fotos...</p>
                    </>
                ) : (
                    <>
                        <span className="upload-zone-icon">📷</span>
                        <h3>Arrastrá tus fotos acá</h3>
                        <p className="text-muted">o hacé clic para seleccionar</p>
                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                            Máx. 5 fotos, 10MB cada una
                        </p>
                    </>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {error && (
                <div className="alert alert-error mt-lg">
                    {error}
                </div>
            )}
        </div>
    );
}
