import React from 'react';

interface HomeScreenProps {
  onStartGame: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="max-w-md p-8 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl text-center">
        <h1 className="main-header mb-4 text-white">sound locator</h1>
        <p className="text-gray-300 mb-8">
          Train your spatial audio localization skills in this tactical minigame.
          Listen to the sound and pinpoint its location on the radar.
        </p>
        <div className="btn-primary-border mx-auto size-20">
          <button
            onClick={onStartGame}
            className="btn-circle bg-gray-900 hover:bg-gray-800 text-white"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
