import React, { useRef, useState, useEffect } from 'react';
import type { UserData } from '../../types/poster';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

export const PhotoUpload: React.FC<Props> = ({ userData, setUserData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const isImageMode = userData.templateType === 'image';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUserData(prev => ({ ...prev, photoUrl: url, videoScale: 1.0, videoOffset: {x: 0, y: 0} }));
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow permissions or try uploading a file instead.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setUserData(prev => ({ ...prev, photoUrl: url, videoScale: 1.0, videoOffset: {x: 0, y: 0} }));
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="bg-[#4a1c0b] p-6 sm:p-8 rounded-2xl shadow-xl border border-[#8b3d0b]">
      <h2 className="text-2xl font-bold text-[#ffca08] mb-6 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {isImageMode ? 'Upload Photo' : 'Upload Video'}
      </h2>
      
      {isCameraOpen ? (
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-black aspect-[3/4] mb-5 border-4 border-[#ffca08]/30 shadow-[0_0_15px_rgba(255,202,8,0.2)]">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover -scale-x-100"
            />
          </div>
          <div className="flex gap-4 w-full max-w-sm">
            {isImageMode ? (
              <button 
                onClick={capturePhoto}
                className="flex-1 bg-[#ffca08] hover:bg-[#e5b607] text-[#381609] font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Snap Photo
              </button>
            ) : (
              <button 
                className="flex-1 bg-gray-500 text-white font-bold py-3 px-6 rounded-xl opacity-50 cursor-not-allowed"
                disabled
              >
                Record Video (Not Supported)
              </button>
            )}
            <button 
              onClick={stopCamera}
              className="flex-1 bg-[#8b3d0b] hover:bg-[#5e2704] text-white font-bold py-3 px-6 rounded-xl transition-all border border-[#d97706]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div 
            className="group border-2 border-dashed border-[#d97706] hover:border-[#ffca08] bg-[#240b03] rounded-xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 bg-[#ffca08] opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept={isImageMode ? 'image/*' : 'video/*'} 
              className="hidden" 
            />
            {userData.photoUrl ? (
              <div className="flex flex-col items-center relative z-10">
                <div className="relative">
                  {isImageMode ? (
                    <img 
                      src={userData.photoUrl}
                      alt="Uploaded preview"
                      className="w-48 h-48 object-cover rounded-xl mb-4 shadow-xl border-2 border-[#ffca08]/50"
                    />
                  ) : (
                    <video 
                      src={userData.photoUrl}
                      className="w-48 h-48 object-cover rounded-xl mb-4 shadow-xl border-2 border-[#ffca08]/50"
                    />
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-[#ffca08] text-[#381609] p-1.5 rounded-full shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                </div>
                <span className="text-sm text-[#ffca08] font-semibold mt-2 group-hover:underline">
                  Click to change {isImageMode ? 'photo' : 'video'}
                </span>
              </div>
            ) : (
              <div className="text-orange-200/60 relative z-10 flex flex-col items-center">
                <div className="p-4 bg-[#4a1c0b] rounded-full mb-4 group-hover:scale-110 group-hover:bg-[#ffca08]/10 transition-transform duration-300">
                  {isImageMode ? (
                    <svg className="h-10 w-10 group-hover:text-[#ffca08] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  ) : (
                    <svg className="h-10 w-10 group-hover:text-[#ffca08] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  )}
                </div>
                <p className="text-base font-semibold text-orange-100 group-hover:text-white transition-colors">
                  Click to upload a {isImageMode ? 'photo' : 'video'}
                </p>
                <p className="text-sm mt-2">{isImageMode ? 'JPG, PNG' : 'MP4, WebM (30s - 1 min)'}</p>
              </div>
            )}
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#d97706]"></div>
            <span className="flex-shrink-0 mx-4 text-[#ffca08]/80 text-sm font-bold tracking-widest">OR</span>
            <div className="flex-grow border-t border-[#d97706]"></div>
          </div>

          <button 
            onClick={startCamera}
            disabled={!isImageMode}
            className={`w-full flex justify-center items-center gap-3 font-bold py-4 px-4 rounded-xl transition-all border shadow-md ${
              isImageMode 
                ? 'bg-[#381609] hover:bg-[#1a0701] text-white border-[#d97706] hover:border-[#ffca08]/50 hover:shadow-lg'
                : 'bg-[#240b03] text-orange-200/30 border-[#4a1c0b] cursor-not-allowed'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take a Selfie {isImageMode ? '' : '(Image Only)'}
          </button>
        </div>
      )}
    </div>
  );
};
