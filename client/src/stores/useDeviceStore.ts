import { create } from 'zustand';

interface DeviceState {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  selectedCameraId: string;
  selectedMicId: string;
  
  // Actions
  setDevices: (cameras: MediaDeviceInfo[], microphones: MediaDeviceInfo[]) => void;
  setSelectedCameraId: (id: string) => void;
  setSelectedMicId: (id: string) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  cameras: [],
  microphones: [],
  selectedCameraId: localStorage.getItem('ensi_camera_id') || '',
  selectedMicId: localStorage.getItem('ensi_mic_id') || '',

  setDevices: (cameras, microphones) => set({ cameras, microphones }),
  
  setSelectedCameraId: (id) => {
    localStorage.setItem('ensi_camera_id', id);
    set({ selectedCameraId: id });
  },
  
  setSelectedMicId: (id) => {
    localStorage.setItem('ensi_mic_id', id);
    set({ selectedMicId: id });
  },
}));
