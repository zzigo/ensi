import { useMixerStore } from '../stores/useMixerStore';
import { AudioEngine } from './AudioEngine';
import { LooperEngine } from './LooperEngine';
import { TransportEngine } from './TransportEngine';

// Basic CC Mapping Definitions
export const MIDI_MAPPINGS = {
  MASTER_VOLUME: 7,
  MIC_VOLUME: 20,
  ELEC_VOLUME: 21,
  TRANSPORT_TOGGLE: 45, 
  BUFFER_1_REC: 30,
  BUFFER_2_REC: 31,
  BUFFER_3_REC: 32,
  BUFFER_4_REC: 33,
};

export class MidiService {
  private static instance: MidiService;
  private access: MIDIAccess | null = null;

  private constructor() {
    // Initialized in MainLayout
  }

  public static getInstance(): MidiService {
    if (!MidiService.instance) {
      MidiService.instance = new MidiService();
    }
    return MidiService.instance;
  }

  public async init() {
    if (this.access) return;
    if (typeof navigator.requestMIDIAccess !== 'function') {
      console.warn('Web MIDI API not supported in this browser');
      return;
    }

    try {
      this.access = await navigator.requestMIDIAccess();
      console.log('🎹 MIDI Access Granted');

      for (const input of this.access.inputs.values()) {
        input.onmidimessage = (msg) => this.handleMidiMessage(msg);
      }

      this.access.onstatechange = (e) => {
        const event = e as MIDIConnectionEvent;
        const port = event.port;
        if (port?.type === 'input' && port.state === 'connected') {
          (port as MIDIInput).onmidimessage = (msg) => this.handleMidiMessage(msg);
        }
      };
    } catch (e) {
      console.error('MIDI Init failed:', e);
    }
  }

  private handleMidiMessage(event: MIDIMessageEvent) {
    if (!event.data) return;
    const [status, data1, data2] = event.data;
    const type = status & 0xf0;

    if (type === 0xb0) {
      this.handleControlChange(data1, data2);
    }
    if (type === 0x90 && data2 > 0) {
      this.handleNoteOn(data1, data2);
    }
  }

  private handleControlChange(cc: number, value: number) {
    const normalized = value / 127;
    const mixer = useMixerStore.getState();
    const audio = AudioEngine.getInstance();
    const looper = LooperEngine.getInstance();
    const transport = TransportEngine.getInstance();

    switch (cc) {
      case MIDI_MAPPINGS.MASTER_VOLUME:
        mixer.setMaster({ volume: normalized * 1.5 });
        audio.setMasterVolume(normalized * 1.5);
        break;
      case MIDI_MAPPINGS.MIC_VOLUME:
        mixer.setAudioChannel('mic', { volume: normalized * 1.5 });
        audio.setChannelVolume('mic', normalized * 1.5);
        break;
      case MIDI_MAPPINGS.ELEC_VOLUME:
        mixer.setAudioChannel('elec', { volume: normalized * 1.5 });
        audio.setChannelVolume('elec', normalized * 1.5);
        break;
      case MIDI_MAPPINGS.TRANSPORT_TOGGLE:
        if (value > 64) { 
            transport.toggle();
        }
        break;
      case MIDI_MAPPINGS.BUFFER_1_REC:
        if (value > 64) looper.startRecording(0, (window as any).__ENSI_MEDIA_STREAM__);
        else looper.stopRecording();
        break;
    }
  }

  private handleNoteOn(note: number, _velocity: number) {
    const looper = LooperEngine.getInstance();
    // Use notes as triggers (Pad mode)
    if (note >= 60 && note <= 63) { // Middle C and up for looper
        looper.togglePlayback(note - 60);
    }
  }
}
