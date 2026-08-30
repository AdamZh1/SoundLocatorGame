import React from 'react';

interface HomeScreenProps {
  onStartGame: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="max-w-md p-8 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Sound Locator</h1>
        <p className="text-gray-300 mb-8">
          Train your spatial audio localization skills in this tactical minigame.
          Listen to the sound and pinpoint its location on the radar.
        </p>
        <button
          onClick={onStartGame}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
