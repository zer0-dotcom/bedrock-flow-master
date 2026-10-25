/* eslint-disable @typescript-eslint/no-explicit-any */
// Local stub — satisfies @heygen/streaming-avatar imports, no npm install needed

export enum TaskType {
  TALK = 'talk',
  REPEAT = 'repeat',
}

export enum VoiceEmotion {
  EXCITED = 'excited',
  SERIOUS = 'serious',
  FRIENDLY = 'friendly',
  SOOTHING = 'soothing',
  BROADCASTER = 'broadcaster',
}

export enum AvatarQuality {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum StreamingEvents {
  AVATAR_START_TALKING = 'avatar_start_talking',
  AVATAR_STOP_TALKING = 'avatar_stop_talking',
  STREAM_READY = 'stream_ready',
  STREAM_DISCONNECTED = 'stream_disconnected',
}

export interface NewSessionData {
  session_id: string;
  sdp: any;
  ice_servers: any[];
}

export class StreamingAvatar {
  constructor(_options: { token: string }) {}
  on(_event: StreamingEvents, _cb: (evt: any) => void): void {}
  off(_event: StreamingEvents, _cb: (evt: any) => void): void {}
  createStartAvatar(_opts: any): Promise<NewSessionData> { return Promise.resolve({} as any); }
  startVoiceChat(_opts?: { useSilencePrompt?: boolean }): Promise<void> { return Promise.resolve(); }
  speak(_opts: { text: string; task_type?: TaskType; taskType?: TaskType }): Promise<any> { return Promise.resolve({}); }
  stopAvatar(): Promise<void> { return Promise.resolve(); }
  closeVoiceChat(): Promise<void> { return Promise.resolve(); }
}

export default StreamingAvatar;
