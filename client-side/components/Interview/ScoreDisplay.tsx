// components/Interview/ScoreDisplay.tsx
interface ScoreDisplayProps {
  score: number;
  title: string;
  subtitle?: string;
  isFinal?: boolean;
}

export default function ScoreDisplay({ score, title, subtitle, isFinal = false }: ScoreDisplayProps) {
  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-green-600';
    if (s >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const ringColorClass = (s: number) => {
    if (s >= 85) return 'stroke-green-600';
    if (s >= 70) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const finalSize = isFinal ? 150 : 120;
  const finalStroke = isFinal ? 12 : 10;
  const radius = (finalSize / 2) - finalStroke;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-lg ${isFinal ? 'bg-gray-50 md:col-span-1' : 'bg-white'}`}>
      <div className="relative" style={{ width: finalSize, height: finalSize }}>
        <svg className="transform -rotate-90" width={finalSize} height={finalSize}>
          <circle
            className="text-gray-200"
            strokeWidth={finalStroke}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={finalSize / 2}
            cy={finalSize / 2}
          />
          <circle
            className={`${ringColorClass(score)} transition-all duration-1000 ease-out`}
            strokeWidth={finalStroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={finalSize / 2}
            cy={finalSize / 2}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </span>
      </div>
      <h3 className={`mt-4 text-xl font-bold ${isFinal ? 'text-blue-600' : 'text-gray-700'}`}>{title}</h3>
      {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
    </div>
  );
}