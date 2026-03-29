import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        scanner.clear().then(() => {
          onClose();
        }).catch(err => {
          console.error("Failed to clear scanner", err);
          onClose();
        });
      },
      (errorMessage) => {
        // console.warn(`QR Code scan error: ${errorMessage}`);
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner on unmount", err));
      }
    };
  }, [onScanSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/90 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-stone-600" />
        </button>
        
        <div className="p-8 text-center">
          <h3 className="text-xl font-bold text-stone-900 mb-2">Scan QR Code</h3>
          <p className="text-stone-500 text-sm mb-6">Position the tracking QR code within the frame</p>
          
          <div id="qr-reader" className="overflow-hidden rounded-2xl border-2 border-stone-100"></div>
          
          <div className="mt-6 text-xs text-stone-400 font-medium uppercase tracking-widest">
            Powered by Tokyo Express
          </div>
        </div>
      </div>
    </div>
  );
}
