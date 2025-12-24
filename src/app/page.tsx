'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
    };
    wind_kph: number;
    wind_dir: string;
    humidity: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    uv: number;
  };
}

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCelsius, setIsCelsius] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      // 添加时间戳参数防止缓存
      const response = await fetch(`/api/weather?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // 模型提问子组件（客户端）
  function ModelAsk() {
    const [model, setModel] = useState<string>('gemini-2.5-flash-lite');
    const [prompt, setPrompt] = useState<string>('');
    const [answer, setAnswer] = useState<string | null>(null);
    const [loadingAsk, setLoadingAsk] = useState(false);
    const models = [
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash-tts',
      'gemini-2.5-flash',
      'gemini-3-flash',
      'gemini-robotics-er-1.5-preview',
      'gemma-3-12b',
      'gemma-3-1b',
      'gemma-3-27b',
      'gemma-3-2b',
      'gemma-3-4b',
      'gemini-2.5-flash-native-audio-dialog',
    ];

    const submitPrompt = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!prompt.trim()) return;
      setLoadingAsk(true);
      setAnswer(null);
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt }),
        });
        const data = await res.json();
        setAnswer(data.answer ?? JSON.stringify(data));
      } catch (err) {
        setAnswer(err instanceof Error ? err.message : '请求出错');
      } finally {
        setLoadingAsk(false);
      }
    };

    return (
      <div>
        <form onSubmit={submitPrompt} className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">选择模型：</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="border rounded px-3 py-2"
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">问题：</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full mt-2 border rounded p-3"
              placeholder="在此输入你的问题（示例：请帮我写一个快速排序实现）"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
              disabled={loadingAsk}
            >
              {loadingAsk ? '回答中...' : '提问'}
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded border"
              onClick={() => { setPrompt(''); setAnswer(null); }}
            >
              清空
            </button>
          </div>
        </form>

        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">回答：</div>
          <div className="min-h-[80px] p-4 bg-gray-50 rounded border">{answer ?? <span className="text-gray-400">暂无回答</span>}</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchWeather();
  }, []);

  const toggleTemperatureUnit = () => {
    setIsCelsius(!isCelsius);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">加载天气数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
          <p className="text-red-600 text-xl font-semibold mb-4">❌ 错误</p>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchWeather}
            className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const temp = isCelsius ? weather.current.temp_c : weather.current.temp_f;
  const feelsLike = isCelsius ? weather.current.feelslike_c : weather.current.feelslike_f;
  const unit = isCelsius ? '°C' : '°F';

  // 根据天气状况选择背景渐变色
  const getBackgroundGradient = () => {
    const condition = weather.current.condition.text.toLowerCase();
    if (condition.includes('sun') || condition.includes('clear')) {
      return 'from-yellow-400 via-orange-400 to-orange-500';
    } else if (condition.includes('cloud')) {
      return 'from-gray-400 via-gray-500 to-gray-600';
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
      return 'from-blue-500 via-blue-600 to-blue-700';
    } else if (condition.includes('snow')) {
      return 'from-blue-200 via-blue-300 to-blue-400';
    } else if (condition.includes('thunder') || condition.includes('storm')) {
      return 'from-purple-600 via-purple-700 to-purple-800';
    }
    return 'from-blue-400 via-blue-500 to-blue-600';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} p-4 sm:p-8 flex items-center justify-center`}>
      <div className="max-w-4xl w-full">
        {/* 主天气卡片 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 sm:p-8 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  {weather.location.name}
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  {weather.location.region}, {weather.location.country}
                </p>
                <p className="text-blue-200 text-xs sm:text-sm mt-1">
                  {new Date(weather.location.localtime).toLocaleString('zh-CN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={toggleTemperatureUnit}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {isCelsius ? '°F' : '°C'}
              </button>
            </div>
          </div>

          {/* 主要天气信息 */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
              <div className="flex items-center mb-6 sm:mb-0">
                <Image
                  src={`https:${weather.current.condition.icon}`}
                  alt={weather.current.condition.text}
                  width={120}
                  height={120}
                  className="w-24 h-24 sm:w-32 sm:h-32"
                />
                <div className="ml-4">
                  <div className="text-6xl sm:text-7xl font-bold text-gray-800">
                    {Math.round(temp)}
                    <span className="text-4xl sm:text-5xl">{unit}</span>
                  </div>
                  <p className="text-xl sm:text-2xl text-gray-600 mt-2 capitalize">
                    {weather.current.condition.text}
                  </p>
                </div>
              </div>
            </div>

            {/* 详细信息网格 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="text-blue-600 text-sm font-semibold mb-1">体感温度</div>
                <div className="text-2xl font-bold text-gray-800">
                  {Math.round(feelsLike)}{unit}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <div className="text-green-600 text-sm font-semibold mb-1">湿度</div>
                <div className="text-2xl font-bold text-gray-800">
                  {weather.current.humidity}%
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                <div className="text-purple-600 text-sm font-semibold mb-1">风速</div>
                <div className="text-2xl font-bold text-gray-800">
                  {weather.current.wind_kph}
                  <span className="text-sm ml-1">km/h</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">{weather.current.wind_dir}</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                <div className="text-orange-600 text-sm font-semibold mb-1">紫外线</div>
                <div className="text-2xl font-bold text-gray-800">
                  {weather.current.uv}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl col-span-2">
                <div className="text-cyan-600 text-sm font-semibold mb-1">能见度</div>
                <div className="text-2xl font-bold text-gray-800">
                  {weather.current.vis_km} km
                </div>
              </div>
            </div>

            {/* 刷新按钮 */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={fetchWeather}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                🔄 随机切换城市
              </button>
            </div>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>数据来源: WeatherAPI.com</p>
        </div>
        {/* 模型问答区域 */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6">
          <h2 className="text-xl font-bold mb-4">模型问答（可选择下表中的模型进行提问）</h2>

          {/* 模型列表 */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-gray-500 border-b">
                  <th className="py-2">模型</th>
                  <th className="py-2">类别</th>
                  <th className="py-2">RPM</th>
                  <th className="py-2">TPM</th>
                  <th className="py-2">RPD</th>
                  <th className="py-2">图表</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {[
                  ['gemini-2.5-flash-lite','文本输出模型','1 / 10','2 / 250K','1 / 20',''],
                  ['gemini-2.5-flash-tts','多模态生成模型','0 / 3','0 / 10K','0 / 10',''],
                  ['gemini-2.5-flash','文本输出模型','0 / 5','0 / 250K','0 / 20',''],
                  ['gemini-3-flash','文本输出模型','0 / 5','0 / 250K','0 / 20',''],
                  ['gemini-robotics-er-1.5-preview','其他模型','0 / 10','0 / 250K','0 / 20',''],
                  ['gemma-3-12b','其他模型','0 / 30','0 / 15K','0 / 14.4K',''],
                  ['gemma-3-1b','其他模型','0 / 30','0 / 15K','0 / 14.4K',''],
                  ['gemma-3-27b','其他模型','0 / 30','0 / 15K','0 / 14.4K',''],
                  ['gemma-3-2b','其他模型','0 / 30','0 / 15K','0 / 14.4K',''],
                  ['gemma-3-4b','其他模型','0 / 30','0 / 15K','0 / 14.4K',''],
                  ['gemini-2.5-flash-native-audio-dialog','Live API','0 / 无限制','0 / 1M','0 / 无限制',''],
                ].map((cols) => (
                  <tr key={cols[0]} className="border-b hover:bg-gray-50">
                    <td className="py-2">{cols[0]}</td>
                    <td className="py-2">{cols[1]}</td>
                    <td className="py-2">{cols[2]}</td>
                    <td className="py-2">{cols[3]}</td>
                    <td className="py-2">{cols[4]}</td>
                    <td className="py-2">{cols[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 提问表单 */}
          <ModelAsk />
        </div>
      </div>
    </div>
  );
}
