"use client";

const Loader: React.FC = () => {
  return (
    <>
      <div className="flex items-center justify-center h-screen">
        <div className="relative w-12 h-12">
          <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/50 animate-pulse"></div>
        </div>
        <style jsx>{`
          .animate-pulse {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% {
              transform: scale(0.9);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.6;
            }
            100% {
              transform: scale(0.9);
              opacity: 1;
            }
          }
        `}</style>{" "}
      </div>
    </>
  );
};

export default Loader;
