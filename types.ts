
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface WebGroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface MapsGroundingChunk {
  maps: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        text: string;
        author: string;
      }[];
    }
  };
}

export type GroundingChunk = WebGroundingChunk | MapsGroundingChunk;

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
