import type { OriginCountry } from './origin-countries';

// ブランド別の原産国プリセット。DAIYA-LABの tools/ebay-dropship/brand_origins.json と同じ内容
// （どちらかを直したらもう片方も直す）。2026-10-08にeBayの出品者が書いたCountry of Originを
// ブランド×商品ごとに約60件集計して作成。タグ・説明文に国名の明記があれば、それが最優先。
//   high  : 自己申告の7割以上が同じ国
//   medium: 半数前後で他国が混ざる（推定として使う）
//   low   : 国がバラバラ。推定せず「不明」にして、タグで確認する
export type OriginConfidence = 'high' | 'medium' | 'low';

export interface BrandOriginPattern {
  label: string;
  origin: OriginCountry;
  confidence: OriginConfidence;
  basis: string;
}

export interface BrandOriginPreset {
  id: string;
  label: string;
  // 先頭が既定。ヴィンテージ・現行・商品タイプなどで国が変わるブランドは複数持つ。
  patterns: BrandOriginPattern[];
}

export const brandOriginPresets: BrandOriginPreset[] = [
  {
    id: 'coach',
    label: 'コーチ（COACH）',
    patterns: [
      {
        label: '現行・Y2K・シグネチャー・表記なし',
        origin: 'china',
        confidence: 'medium',
        basis:
          'Y2Kシグネチャー：China 83%、キーホルダー系：China 84%。ベトナム・インドネシア・フィリピンも混在（安全側で中国）'
      },
      {
        label: 'ヴィンテージ・NYC・レガシー（Made in USA）',
        origin: 'us_or_other_exempt',
        confidence: 'high',
        basis: 'United States 82〜95%（Costa Rica・中国が少数）'
      }
    ]
  },
  {
    id: 'prada',
    label: 'プラダ（PRADA）',
    patterns: [
      {
        label: '全般',
        origin: 'italy',
        confidence: 'high',
        basis: 'Italy 81〜91%'
      }
    ]
  },
  {
    id: 'miumiu',
    label: 'ミュウミュウ（Miu Miu）',
    patterns: [
      {
        label: '全般',
        origin: 'italy',
        confidence: 'high',
        basis: 'Italy 75%、トルコ12%'
      }
    ]
  },
  {
    id: 'marcbymarcjacobs',
    label: 'マーク バイ マーク ジェイコブス',
    patterns: [
      {
        label: 'バッグ（Qシリーズ等）',
        origin: 'indonesia',
        confidence: 'medium',
        basis: 'Indonesia 46%、Italy 18%、Vietnam 15%、China 9%'
      },
      {
        label: '財布',
        origin: 'italy',
        confidence: 'medium',
        basis: 'Italy 57%、China 26%'
      },
      {
        label: '革のトート',
        origin: 'unknown',
        confidence: 'low',
        basis: 'Italy30%／Indonesia26%／Vietnam11%／Japan11%／China11%とバラバラ。タグで確認'
      }
    ]
  },
  {
    id: 'rrl',
    label: 'RRL（ダブルアールエル）',
    patterns: [
      {
        label: 'デニム・ジーンズ',
        origin: 'us_or_other_exempt',
        confidence: 'medium',
        basis: 'United States 72%、Japan 10%、Mexico 8%'
      },
      {
        label: 'バッグ・革小物',
        origin: 'unknown',
        confidence: 'low',
        basis: 'Japan31%／Italy21%／India15%とバラバラ。タグで確認'
      },
      {
        label: 'ジャケット・シャツ',
        origin: 'unknown',
        confidence: 'low',
        basis: 'India26%／China21%／Japan21%／USA13%とバラバラ。タグで確認'
      }
    ]
  },
  {
    id: 'bally',
    label: 'バリー（BALLY）',
    patterns: [
      {
        label: '全般',
        origin: 'italy',
        confidence: 'high',
        basis: 'Italy 61〜78%、Switzerland 14〜20%'
      }
    ]
  },
  {
    id: 'gucci',
    label: 'グッチ（GUCCI）',
    patterns: [
      {
        label: '全般',
        origin: 'italy',
        confidence: 'high',
        basis: 'Italy 90%'
      }
    ]
  },
  {
    id: 'furla',
    label: 'フルラ（FURLA）',
    patterns: [
      {
        label: '全般',
        origin: 'italy',
        confidence: 'high',
        basis: 'Italy 86%'
      }
    ]
  },
  {
    id: 'burberry',
    label: 'バーバリー（BURBERRY）',
    patterns: [
      {
        label: '全般',
        origin: 'italy',
        confidence: 'medium',
        basis:
          'Italy 70%、UK 20%（記載10件と少ない）。ヴィンテージ・ノバチェックは英国・日本製もあるので説明文を優先'
      }
    ]
  },
  {
    id: 'fendi',
    label: 'フェンディ（FENDI）',
    patterns: [
      {
        label: '全般',
        origin: 'italy',
        confidence: 'high',
        basis: 'ブランドの一般的な製造国'
      }
    ]
  },
  {
    id: 'bottega',
    label: 'ボッテガ・ヴェネタ',
    patterns: [
      {
        label: '全般',
        origin: 'italy',
        confidence: 'high',
        basis: 'ブランドの一般的な製造国'
      }
    ]
  },
  {
    id: 'ferragamo',
    label: 'フェラガモ（Ferragamo）',
    patterns: [
      {
        label: '全般',
        origin: 'italy',
        confidence: 'high',
        basis: 'ブランドの一般的な製造国'
      }
    ]
  },
  {
    id: 'hermes',
    label: 'エルメス（HERMÈS）',
    patterns: [
      {
        label: '全般',
        origin: 'france',
        confidence: 'high',
        basis: 'ブランドの一般的な製造国'
      }
    ]
  },
  {
    id: 'diesel',
    label: 'ディーゼル（DIESEL）',
    patterns: [
      {
        label: '全般',
        origin: 'unknown',
        confidence: 'low',
        basis: 'Italy45%／China21%／Japan9%／India6%とバラバラ。タグで確認'
      }
    ]
  },
  {
    id: 'katespade',
    label: 'ケイト・スペード',
    patterns: [
      {
        label: '全般',
        origin: 'unknown',
        confidence: 'low',
        basis: 'China55%／Vietnam22%／Cambodia11%（記載9件と少ない）。タグで確認'
      }
    ]
  },
  {
    id: 'porter',
    label: 'ポーター（吉田カバン）',
    patterns: [
      {
        label: '全般',
        origin: 'japan',
        confidence: 'high',
        basis: '日本のブランド'
      }
    ]
  },
  {
    id: 'samantha',
    label: 'サマンサタバサ',
    patterns: [
      {
        label: '全般',
        origin: 'japan',
        confidence: 'medium',
        basis: '日本のブランド。中国製も混ざるのでタグ優先'
      }
    ]
  }
];

export const confidenceLabels: Record<OriginConfidence, string> = {
  high: '確度：高い',
  medium: '確度：中（推定）',
  low: '確度：低い（推定せず不明扱い）'
};
