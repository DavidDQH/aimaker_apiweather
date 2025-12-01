import { NextResponse } from 'next/server';

const API_KEY = 'a4226a1c965d495e92754736250112';
const API_BASE_URL = 'https://api.weatherapi.com/v1';

// 随机城市列表 - 中国城市
const cities = [
  'Beijing',      // 北京
  'Shanghai',     // 上海
  'Guangzhou',    // 广州
  'Shenzhen',     // 深圳
  'Chengdu',      // 成都
  'Hangzhou',     // 杭州
  'Chongqing',    // 重庆
  'Wuhan',        // 武汉
  'Xi\'an',       // 西安
  'Suzhou',       // 苏州
  'Nanjing',      // 南京
  'Tianjin',      // 天津
  'Qingdao',      // 青岛
  'Dalian',       // 大连
  'Xiamen',       // 厦门
  'Kunming',      // 昆明
  'Harbin',       // 哈尔滨
  'Changsha',     // 长沙
  'Taipei',       // 台北
  'Hong Kong',    // 香港
];

export async function GET() {
  try {
    // 随机选择一个城市
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    
    const response = await fetch(
      `${API_BASE_URL}/current.json?key=${API_KEY}&q=${randomCity}&aqi=yes&lang=zh`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching weather:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

