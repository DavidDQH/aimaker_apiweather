import { NextResponse } from 'next/server';

// 尝试使用 Google Generative AI 官方包调用模型；如果未配置或调用失败则降级为模拟响应
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const model = String(body.model ?? 'gemini-2.5-flash-lite');
    const prompt = String(body.prompt ?? '');

    const lowered = prompt.toLowerCase();
    if (lowered.includes('是什么模型') || lowered.includes('是谁') || lowered.includes('谁是')) {
      return NextResponse.json({
        answer:
          '我是claude-4.5-opus-high-thinking模型实现的AI助手，深度集成于Cursor IDE，能够高效处理您的编程和技术问题，只要是编程相关的内容，我都可以帮忙！你现在有什么想做的？',
        model,
        prompt,
      });
    }

    // 如果配置了 GOOGLE_API_KEY，尝试调用 Google Generative AI SDK
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log("apiKey===",apiKey);
    if (apiKey) {
      try {
        // 动态导入以避免在未安装依赖时抛错
        // 使用官方 SDK 的常见用法：new GoogleGenerativeAI(apiKey).getGenerativeModel({model}).generateContent(...)
        const sdk = await import('@google/generative-ai').catch(() => null);
        if (sdk && (sdk as any).GoogleGenerativeAI) {
          const { GoogleGenerativeAI } = sdk as any;
          const client = new GoogleGenerativeAI(apiKey);
          const genModel = client.getGenerativeModel({ model });
          // SDK 在不同版本签名可能不同，尝试常见调用方式
          try {
            const result = await genModel.generateContent(prompt);
            console.log('result===', result);

            // 统一解析返回结构：优先使用 response.text()，其次尝试 candidates，再回退到 result.text 或 JSON
            const resp = result?.response ?? result;
            let parsedText = '';
            if (resp) {
              if (typeof resp.text === 'function') {
                parsedText = await resp.text();
              } else if (typeof resp.text === 'string') {
                parsedText = resp.text;
              } else if (Array.isArray(resp.candidates) && resp.candidates.length > 0) {
                const cand = resp.candidates[0];
                if (typeof cand.text === 'string') {
                  parsedText = cand.text;
                } else if (Array.isArray(cand.content)) {
                  const first = cand.content.find((c: any) => c?.type === 'output_text' || typeof c?.text === 'string') ?? cand.content[0];
                  parsedText = first?.text ?? JSON.stringify(cand.content);
                } else {
                  parsedText = JSON.stringify(cand);
                }
              } else if (typeof result.text === 'function') {
                parsedText = await result.text();
              } else if (typeof result.text === 'string') {
                parsedText = result.text;
              } else {
                parsedText = JSON.stringify(result);
              }
            } else {
              parsedText = JSON.stringify(result);
            }

            const usage = resp?.usageMetadata ?? resp?.usage ?? result?.usage ?? null;
            const modelVersion = resp?.modelVersion ?? result?.modelVersion ?? null;
            const responseId = resp?.responseId ?? result?.responseId ?? null;

            return NextResponse.json({
              answer: parsedText,
              model,
              prompt,
              usage,
              modelVersion,
              responseId,
              raw: result,
            });
          } catch (innerErr) {
            const simulatedErr = `调用模型时发生错误：${String(innerErr)}\n\n（已回退到模拟响应）\n您提问：${prompt}`;
            return NextResponse.json({ answer: simulatedErr, model, prompt, error: String(innerErr) });
          }
        }
      } catch (err) {
        // 忽略，进入模拟响应
        console.error('Google SDK 调用异常：', err);
      }
    }

    // 默认模拟回答（无 API key 或 SDK 未安装）
    const simulated = `【模拟回答 - ${model}】\n您提问：${prompt}\n\n这是一个模拟响应，若要接入真实模型，请在项目根创建一个 .env 文件并设置 GOOGLE_API_KEY，然后安装 @google/generative-ai。`;
    return NextResponse.json({ answer: simulated, model, prompt });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error) ? err.message : 'Invalid request' }, { status: 400 });
  }
}


