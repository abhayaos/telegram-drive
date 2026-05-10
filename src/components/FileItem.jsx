import { useState } from 'react';

const FILE_ICONS = {
  image: <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  video: <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  audio: <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
  pdf: <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  archive: <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  default: <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
};

function getIcon(mt) {
  if (!mt) return FILE_ICONS.default;
  if (mt.startsWith('image/')) return FILE_ICONS.image;
  if (mt.startsWith('video/')) return FILE_ICONS.video;
  if (mt.startsWith('audio/')) return FILE_ICONS.audio;
  if (mt === 'application/pdf') return FILE_ICONS.pdf;
  if (mt.includes('zip') || mt.includes('rar') || mt.includes('tar') || mt.includes('7z')) return FILE_ICONS.archive;
  return FILE_ICONS.default;
}

function getColor(mt) {
  if (!mt) return 'from-blue-600/20 to-blue-600/10 border-blue-500/30';
  if (mt.startsWith('image/')) return 'from-green-600/20 to-green-600/10 border-green-500/30';
  if (mt.startsWith('video/')) return 'from-purple-600/20 to-purple-600/10 border-purple-500/30';
  if (mt.startsWith('audio/')) return 'from-yellow-600/20 to-yellow-600/10 border-yellow-500/30';
  if (mt === 'application/pdf') return 'from-red-600/20 to-red-600/10 border-red-500/30';
  if (mt.includes('zip') || mt.includes('rar') || mt.includes('tar') || mt.includes('7z')) return 'from-orange-600/20 to-orange-600/10 border-orange-500/30';
  return 'from-blue-600/20 to-blue-600/10 border-blue-500/30';
}

export default function FileItem({ file, view, onDelete, downloadUrl, previewUrl, formatSize }) {
  const [showPreview, setShowPreview] = useState(false);

  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');

  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition group">
        {getIcon(file.mimeType)}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{file.name}</p>
        </div>
        <span className="text-xs text-gray-500 hidden sm:block">{formatSize(file.size)}</span>
        <span className="text-xs text-gray-500 hidden md:block">{new Date(file.date).toLocaleDateString()}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <a href={downloadUrl} className="p-1.5 rounded-lg hover:bg-[#252525] text-gray-400 hover:text-blue-400 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </a>
          <button onClick={() => onDelete(file.id)} className="p-1.5 rounded-lg hover:bg-[#252525] text-gray-400 hover:text-red-400 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div onClick={() => setShowPreview(true)} className="group relative bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden hover:border-[#444] transition cursor-pointer">
        <div className={`aspect-square bg-gradient-to-br ${getColor(file.mimeType)} flex items-center justify-center`}>
          {isImage ? (
            <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
          ) : isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <svg className="absolute w-12 h-12 text-white opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              {getIcon(file.mimeType)}
            </div>
          ) : (
            getIcon(file.mimeType)
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs text-white truncate">{file.name}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{formatSize(file.size)}</p>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
          <a href={downloadUrl} onClick={(e) => e.stopPropagation()} className="p-1.5 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-black/80 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </a>
          <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} className="p-1.5 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-red-500/80 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowPreview(false)}>
          <div className="max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                </div>
                <div className="flex gap-2">
                  <a href={downloadUrl} className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </a>
                  <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-[#252525] text-gray-400 transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-black/40">
                {isImage ? (
                  <img src={previewUrl} alt={file.name} className="max-w-full max-h-[65vh] object-contain rounded-lg" />
                ) : isVideo ? (
                  <video src={previewUrl} controls className="max-w-full max-h-[65vh] rounded-lg" />
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    {getIcon(file.mimeType)}
                    <p className="mt-2 text-sm">Preview not available</p>
                    <a href={downloadUrl} className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition">Download File</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
