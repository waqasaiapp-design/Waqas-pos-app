import React from 'react';
import { ShieldAlert, QrCode, RefreshCw } from 'lucide-react';
import { DeviceInfo } from '../types/pos';

interface RevokedDeviceModalProps {
  device: DeviceInfo;
  onOpenPairQr: () => void;
}

export const RevokedDeviceModal: React.FC<RevokedDeviceModalProps> = ({
  device,
  onOpenPairQr,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 text-center shadow-2xl border border-red-200 space-y-5 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">Device Access Revoked</h2>
          <p className="text-xs text-red-600 font-bold mt-1">Authorization Disconnected by Administrator</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left text-slate-600 space-y-1.5">
          <p className="text-slate-500 font-medium">
            This device has been disconnected and can no longer process sales or access supermarket records:
          </p>
          <div className="pt-1 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Terminal Name:</span>
              <span className="font-bold text-slate-900">{device.deviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Device ID:</span>
              <span className="font-mono text-slate-700">{device.deviceId}</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          If this was unintentional, you can pair this device again by having the store owner approve a new QR code connection.
        </p>

        <button
          onClick={onOpenPairQr}
          className="w-full py-3.5 bg-[#057a44] hover:bg-[#046337] text-white font-black text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan New QR Code / Re-Authenticate</span>
        </button>
      </div>
    </div>
  );
};
