import React from 'react';
import { Upload, Download } from 'lucide-react';

interface ImportExportButtonsProps {
    isDarkMode: boolean;
    onExport: () => void;
    onImportClick: () => void;
}

export const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
    isDarkMode,
    onExport,
    onImportClick
}) => {
    return (
        <div className="flex gap-2">
            <button
                onClick={onExport}
                className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'
                    }`}
            >
                <Upload size={14} /> Export HTML
            </button>
            <button
                onClick={onImportClick}
                className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'
                    }`}
            >
                <Download size={14} /> Import
            </button>
        </div>
    );
};
