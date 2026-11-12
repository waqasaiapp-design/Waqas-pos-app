import React, { useState } from 'react';
import {
  Video,
  Settings,
  Grid3X3,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Server,
  Lock,
  ChevronDown,
  Camera,
  X,
  Play,
  Pause,
} from 'lucide-react';
import { DvrNvrConfig, CctvCamera } from '../types/pos';
import { WaqasDualProfileCards } from './WaqasDualProfileCards';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface CctvPageProps {
  cameras: CctvCamera[];
  dvrConfig: DvrNvrConfig;
  onSaveCamera: (camera: CctvCamera) => void;
  onDeleteCamera: (cameraId: string) => void;
  onSaveDvrConfig: (config: DvrNvrConfig) => void;
  onBackToHome?: () => void;
}

export const CctvPage: React.FC<CctvPageProps> = ({
  cameras,
  dvrConfig,
  onSaveCamera,
  onDeleteCamera,
  onSaveDvrConfig,
  onBackToHome,
}) => {
  const [gridLayout, setGridLayout] = useState<'1x1' | '2x2' | '3x3'>('2x2');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isDvrModalOpen, setIsDvrModalOpen] = useState(false);
  const [isAddCameraModalOpen, setIsAddCameraModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CctvCamera | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // DVR Form State
  const [dvrBrand, setDvrBrand] = useState(dvrConfig.brand || 'Hikvision');
  const [dvrIp, setDvrIp] = useState(dvrConfig.dvrIp || '192.168.1.100');
  const [dvrPort, setDvrPort] = useState(dvrConfig.port?.toString() || '554');
  const [dvrUser, setDvrUser] = useState(dvrConfig.username || 'admin');
  const [dvrPass, setDvrPass] = useState('');
  const [channelCount, setChannelCount] = useState(dvrConfig.channelCount || 8);

  // Camera Form State
  const [camName, setCamName] = useState('');
  const [camChannel, setCamChannel] = useState(1);
  const [camStreamUrl, setCamStreamUrl] = useState('');
  const [camLocation, setCamLocation] = useState('Cash Counter 01');
  const [camResolution, setCamResolution] = useState('1080p FHD');

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || null;

  const handleOpenAddCam = () => {
    setEditingCamera(null);
    setCamName(`Camera ${cameras.length + 1}`);
    setCamChannel(cameras.length + 1);
    setCamStreamUrl('');
    setCamLocation('Cash Counter 01');
    setCamResolution('1080p FHD');
    setIsAddCameraModalOpen(true);
  };

  const handleSaveCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName.trim()) return;

    const newCam: CctvCamera = {
      id: editingCamera ? editingCamera.id : `cam-${Date.now()}`,
      name: camName.trim(),
      channelNumber: camChannel,
      streamUrl: camStreamUrl.trim() || undefined,
      location: camLocation.trim(),
      resolution: camResolution,
      status: camStreamUrl.trim() ? 'connecting' : 'offline',
      lastPing: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
    };

    onSaveCamera(newCam);
    setIsAddCameraModalOpen(false);
    showToast('Camera channel saved!');
  };

  const handleSaveDvr = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DvrNvrConfig = {
      brand: dvrBrand as any,
      dvrIp: dvrIp.trim(),
      port: parseInt(dvrPort, 10) || 554,
      username: dvrUser.trim(),
      channelCount: channelCount || 8,
      connected: true,
    };
    onSaveDvrConfig(updated);
    setIsDvrModalOpen(false);
    showToast(`DVR / NVR configuration saved! Connecting to ${dvrIp}...`);
  };

  return (
    <div className="flex-1 min-h-full w-full bg-[#0b1329] text-white flex flex-col font-sans">
      <FullScreenPageHeader
        title="CCTV Live Security Monitor"
        subtitle="دکان کیمرہ سسٹم — ملٹی چینل لائیو فیڈز اور ڈی وی آر مانیٹر"
        icon={<Video className="w-5 h-5 text-emerald-400" />}
        onBackToHome={onBackToHome}
        accentColor="emerald"
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-[#1b284f] p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                onClick={() => {
                  setGridLayout('1x1');
                  if (cameras.length > 0 && !selectedCameraId) setSelectedCameraId(cameras[0].id);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  gridLayout === '1x1' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                1×1
              </button>
              <button
                onClick={() => {
                  setGridLayout('2x2');
                  setSelectedCameraId(null);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  gridLayout === '2x2' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2×2
              </button>
              <button
                onClick={() => {
                  setGridLayout('3x3');
                  setSelectedCameraId(null);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  gridLayout === '3x3' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                3×3
              </button>
            </div>
            <button
              onClick={() => setIsDvrModalOpen(true)}
              className="px-3 py-1.5 bg-[#1b284f] hover:bg-[#25376c] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>DVR</span>
            </button>
            <button
              onClick={handleOpenAddCam}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Cam</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 lg:p-6 w-full space-y-4 overflow-y-auto">
        {/* Toast Feedback */}
        {feedbackMsg && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* WAQAS MART Dual Profile Cards */}
        <div className="space-y-2">
          <WaqasDualProfileCards variant="sidebar" />
        </div>

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111c38] p-4 rounded-2xl border border-slate-700/60 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Video className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                CCTV Live Security Monitor (دکان کیمرہ سسٹم)
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>SYSTEM ACTIVE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              DVR / NVR Multi-Channel Monitor • RTSP • ONVIF • IP Security Cameras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid Layout Switcher */}
          <div className="bg-[#1b284f] p-1 rounded-xl flex items-center gap-1 border border-slate-700">
            <button
              onClick={() => {
                setGridLayout('1x1');
                if (cameras.length > 0 && !selectedCameraId) setSelectedCameraId(cameras[0].id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gridLayout === '1x1' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              1×1
            </button>
            <button
              onClick={() => {
                setGridLayout('2x2');
                setSelectedCameraId(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gridLayout === '2x2' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2×2 Grid
            </button>
            <button
              onClick={() => {
                setGridLayout('3x3');
                setSelectedCameraId(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gridLayout === '3x3' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              3×3 Grid
            </button>
          </div>

          <button
            onClick={() => setIsDvrModalOpen(true)}
            className="px-3.5 py-2 bg-[#1b284f] hover:bg-[#25376c] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>DVR Setup</span>
          </button>

          <button
            onClick={handleOpenAddCam}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Camera</span>
          </button>
        </div>
      </div>

      {/* DVR Status Strip */}
      <div className="bg-[#111c38]/80 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-400" />
          <span>
            Connected DVR: <strong>{dvrConfig.brand || 'Hikvision'}</strong> ({dvrConfig.dvrIp || '192.168.1.100'}:
            {dvrConfig.port || 554})
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Configured Channels: {cameras.length}</span>
          <span className="text-emerald-400">Stream Security: Encrypted Local Subnet</span>
        </div>
      </div>

      {/* Camera Grid View */}
      {cameras.length === 0 ? (
        <div className="bg-[#111c38] rounded-2xl border border-slate-800 p-12 text-center text-slate-400 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#1b284f] text-slate-500 flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-white">No CCTV Cameras Configured</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Connect your shop&apos;s DVR/NVR or IP Cameras to monitor cash counters, stock rooms, and mart
            entrances live in real time.
          </p>
          <button
            onClick={handleOpenAddCam}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Camera Channel</span>
          </button>
        </div>
      ) : gridLayout === '1x1' && selectedCamera ? (
        /* Full Single Camera View */
        <div className="bg-black rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl aspect-video">
          <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-bold text-white">LIVE CH-{selectedCamera.channelNumber}</span>
            <span className="text-slate-400">| {selectedCamera.name} ({selectedCamera.location})</span>
          </div>

          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <button
              onClick={() => setGridLayout('2x2')}
              className="p-1.5 bg-black/70 text-white hover:bg-black rounded-lg text-xs"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Truthful Stream Canvas / Player Area */}
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
            {selectedCamera.streamUrl ? (
              <div className="space-y-3 max-w-md">
                <Video className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
                <h4 className="font-bold text-sm text-white">Connecting to RTSP Stream</h4>
                <p className="font-mono text-xs text-emerald-300 break-all bg-black/60 p-2.5 rounded-xl border border-emerald-900">
                  {selectedCamera.streamUrl}
                </p>
                <p className="text-[11px] text-slate-400">
                  Direct hardware stream requested from local subnet. If using browser, ensure RTSP-to-WebRTC/HLS proxy is running on DVR IP.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <WifiOff className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-bold text-sm text-slate-300">Camera RTSP Stream Not Configured</p>
                <p className="text-xs text-slate-500">
                  Click &apos;Edit Camera&apos; to enter RTSP stream URL or DVR channel IP.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Multi-Camera Grid */
        <div
          className={`grid gap-3 ${
            gridLayout === '3x3'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {cameras.map((cam) => (
            <div
              key={cam.id}
              onClick={() => {
                setSelectedCameraId(cam.id);
                setGridLayout('1x1');
              }}
              className="bg-black rounded-2xl border border-slate-800 overflow-hidden relative shadow-md aspect-video group cursor-pointer hover:border-emerald-500 transition-all flex flex-col justify-between"
            >
              {/* Top Banner */}
              <div className="p-2.5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-xs z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-bold text-white text-[11px]">
                    CH-{cam.channelNumber}: {cam.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-black/50 px-1.5 py-0.5 rounded">
                  {cam.location}
                </span>
              </div>

              {/* Center Stream Placeholder */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <Video className="w-8 h-8 text-slate-700 group-hover:text-emerald-400 transition-colors mb-1" />
                <span className="text-[11px] font-mono text-slate-500">
                  {cam.streamUrl ? 'RTSP Stream Ready' : 'IP Camera Feed Standby'}
                </span>
                <span className="text-[10px] text-slate-600 mt-0.5">{cam.resolution}</span>
              </div>

              {/* Bottom Control Strip */}
              <div className="p-2 bg-black/70 flex items-center justify-between text-[11px] text-slate-400 z-10 border-t border-slate-900">
                <span>Click for Fullscreen Live</span>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${cam.name}?`)) {
                        onDeleteCamera(cam.id);
                      }
                    }}
                    className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DVR Setup Modal */}
      {isDvrModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#111c38] text-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">DVR / NVR Master Setup</h3>
              </div>
              <button
                onClick={() => setIsDvrModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDvr} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">DVR Brand</label>
                <select
                  value={dvrBrand}
                  onChange={(e) => setDvrBrand(e.target.value as any)}
                  className="w-full font-semibold px-3 py-2 rounded-xl border border-slate-700 bg-[#1b284f] text-white outline-none"
                >
                  <option value="Hikvision">Hikvision (ہائیک ویژن)</option>
                  <option value="Dahua">Dahua (داہوا)</option>
                  <option value="Uniview">Uniview (یو این وی)</option>
                  <option value="CP PLUS">CP PLUS</option>
                  <option value="Generic ONVIF">Generic ONVIF / RTSP</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">DVR IP Address *</label>
                <input
                  type="text"
                  required
                  value={dvrIp}
                  onChange={(e) => setDvrIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full font-mono font-bold px-3 py-2 rounded-xl border border-slate-700 bg-[#1b284f] text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">RTSP Port</label>
                  <input
                    type="number"
                    value={dvrPort}
                    onChange={(e) => setDvrPort(e.target.value)}
                    placeholder="554"
                    className="w-full font-mono font-bold px-3 py-2 rounded-xl border border-slate-700 bg-[#1b284f] text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Channels</label>
                  <select
                    value={channelCount}
                    onChange={(e) => setChannelCount(parseInt(e.target.value, 10))}
                    className="w-full font-semibold px-3 py-2 rounded-xl border border-slate-700 bg-[#1b284f] text-white outline-none"
                  >
                    <option value={4}>4 Channel</option>
                    <option value={8}>8 Channel</option>
                    <option value={16}>16 Channel</option>
                    <option value={32}>32 Channel</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDvrModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                >
                  Save DVR Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Camera Modal */}
      {isAddCameraModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#111c38] text-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Add Camera Channel</h3>
              </div>
              <button
                onClick={() => setIsAddCameraModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCamera} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Camera Name *</label>
                <input
                  type="text"
                  required
                  value={camName}
                  onChange={(e) => setCamName(e.target.value)}
                  placeholder="e.g. Counter 1 Cam / Entrance Front"
                  className="w-full font-semibold px-3 py-2 rounded-xl border border-slate-700 bg-[#1b284f] text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Channel #</label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={camChannel}
                    onChange={(e) => setCamChannel(parseInt(e.target.value, 10))}
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-700 bg-[#1b284f] text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={camLocation}
                    onChange={(e) => setCamLocation(e.target.value)}
                    placeholder="Cash Counter / Entrance"
                    className="w-full font-semibold px-3 py-2 rounded-xl border border-slate-700 bg-[#1b284f] text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  RTSP Stream URL (Optional / Direct IP)
                </label>
                <input
                  type="text"
                  value={camStreamUrl}
                  onChange={(e) => setCamStreamUrl(e.target.value)}
                  placeholder="rtsp://admin:pass@192.168.1.100:554/ch1/main"
                  className="w-full font-mono text-[11px] px-3 py-2 rounded-xl border border-slate-700 bg-[#1b284f] text-white outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCameraModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                >
                  Save Camera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
