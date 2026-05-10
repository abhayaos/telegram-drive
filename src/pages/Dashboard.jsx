import { useState, useEffect, useCallback } from 'react';
import { fetchFiles, uploadFile, deleteFile, getDownloadUrl, getPreviewUrl } from '../api.js';
import Header from '../components/Header.jsx';
import FileItem from '../components/FileItem.jsx';
import UploadDialog from '../components/UploadDialog.jsx';

export default function Dashboard({ onLogout }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFiles();
      setFiles(result);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load files');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (file) => {
    setError(null);
    try {
      await uploadFile(file);
      setShowUpload(false);
      loadFiles();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    try {
      await deleteFile(id);
      loadFiles();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Delete failed');
    }
  };

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0, s = bytes;
    while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
    return `${s.toFixed(1)} ${u[i]}`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Header
        view={view}
        onViewChange={setView}
        search={search}
        onSearchChange={setSearch}
        onLogout={onLogout}
        fileCount={files.length}
        totalSize={formatSize(totalSize)}
      />

      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {error && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">
            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <p className="text-lg">No files yet</p>
            <p className="text-sm mt-1">Upload your first file to get started</p>
          </div>
        ) : (
          <div className={view === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
            : 'space-y-1'
          }>
            {filtered.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                view={view}
                onDelete={handleDelete}
                downloadUrl={getDownloadUrl(file.id)}
                previewUrl={getPreviewUrl(file.id)}
                formatSize={formatSize}
              />
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setShowUpload(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition hover:scale-105 active:scale-95">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {showUpload && <UploadDialog onUpload={handleUpload} onClose={() => setShowUpload(false)} />}
    </div>
  );
}
