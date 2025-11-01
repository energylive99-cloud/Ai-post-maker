
import React from 'react';
import { GroundingChunk, WebGroundingChunk, MapsGroundingChunk } from '../types';

interface GroundingResultsProps {
  result: {
    text: string;
    chunks: GroundingChunk[];
  };
}

const isWebChunk = (chunk: GroundingChunk): chunk is WebGroundingChunk => 'web' in chunk;
const isMapsChunk = (chunk: GroundingChunk): chunk is MapsGroundingChunk => 'maps' in chunk;

export const GroundingResults: React.FC<GroundingResultsProps> = ({ result }) => {
  return (
    <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
      <h4 className="font-semibold text-indigo-300 mb-2">Enhanced with Grounding</h4>
      <p className="text-sm whitespace-pre-wrap mb-4">{result.text}</p>
      
      {result.chunks.length > 0 && (
        <div>
          <h5 className="text-xs font-bold uppercase text-gray-400 mb-2">Sources:</h5>
          <ul className="space-y-1">
            {result.chunks.map((chunk, index) => {
              if (isWebChunk(chunk)) {
                return (
                  <li key={index}>
                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                      {chunk.web.title || chunk.web.uri}
                    </a>
                  </li>
                );
              }
              if (isMapsChunk(chunk)) {
                return (
                   <li key={index}>
                    <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:underline">
                      {chunk.maps.title || 'View on Google Maps'}
                    </a>
                  </li>
                )
              }
              return null;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
