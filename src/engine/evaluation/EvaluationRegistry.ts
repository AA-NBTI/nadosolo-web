/**
 * [평가 모듈 레지스트리] EvaluationRegistry
 * 핫플러그(Hot-Plug) 계약: 모듈의 동적 삽입(register) 및 제거(unregister) 전담
 * GEMINI.md 헌법 2장 [원칙 4] 준수
 */

import { EvaluationModule } from './types';
import { ModuleTrack3040 } from './modules/ModuleTrack3040';
import { ModuleTrack5060 } from './modules/ModuleTrack5060';
import { ModuleDiningEnvironment } from './modules/ModuleDiningEnvironment';

class EvaluationRegistryClass {
  private modules: Map<string, EvaluationModule> = new Map();

  constructor() {
    // 기본 표준 마이크로 모듈 등록 (3040, 5060, 다이닝 환경)
    this.register(new ModuleTrack3040());
    this.register(new ModuleTrack5060());
    this.register(new ModuleDiningEnvironment());
  }

  /**
   * 신규 분류 모듈 핫플러그 삽입 (Plug-in)
   */
  register(module: EvaluationModule): void {
    this.modules.set(module.id, module);
  }

  /**
   * 모듈 핫플러그 제거 (Plug-out)
   */
  unregister(moduleId: string): boolean {
    return this.modules.delete(moduleId);
  }

  /**
   * 특정 모듈 단건 조회
   */
  getModule(moduleId: string): EvaluationModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * 전체 등록 모듈 목록 조회
   */
  getAllModules(): EvaluationModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * 모임 세부 분류에 따른 활성 모듈 조합 반환 (예: 3040 다이닝 = 3040 모듈 + 다이닝 모듈)
   */
  getModulesForContext(targetAgeGroup?: '3045_PRIME' | '5060_GOLDEN' | 'ALL'): EvaluationModule[] {
    const diningEnv = this.modules.get('MOD_THEME_DINING');
    const result: EvaluationModule[] = [];

    if (targetAgeGroup === '5060_GOLDEN') {
      const m5060 = this.modules.get('MOD_TRACK_5060');
      if (m5060) result.push(m5060);
    } else {
      // 3040 트랙 기본
      const m3040 = this.modules.get('MOD_TRACK_3040');
      if (m3040) result.push(m3040);
    }

    if (diningEnv) {
      result.push(diningEnv);
    }

    return result;
  }
}

export const EvaluationRegistry = new EvaluationRegistryClass();

