/**
 * ブリーフィングアプリケーション層モジュール
 *
 * 今日のブリーフィングデータ構築とAI挨拶文生成を提供します。
 *
 * @module lib/application/briefing
 */

export { type BriefingData, buildBriefing } from "./build-briefing";
export { getOrGenerateGreeting } from "./generate-greeting";
