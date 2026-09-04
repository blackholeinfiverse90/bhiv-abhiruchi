import ApiClient from './apiClient';

/**
 * Multi-Domain Assessment Service
 * Handles domain selection, adaptive question weighting, and multi-domain assessment generation
 * Supports 13 domains with adaptive difficulty based on student selections
 */

export const DOMAINS = {
  IOT: { id: 'iot', name: 'IoT', fullName: 'Internet of Things (IoT)', icon: 'Cpu', color: 'blue' },
  BLOCKCHAIN: { id: 'blockchain', name: 'Blockchain', fullName: 'Blockchain Technology', icon: 'Link', color: 'purple' },
  HUMANOID_ROBOTICS: { id: 'humanoid_robotics', name: 'Humanoid Robotics', fullName: 'Humanoid Robotics', icon: 'Bot', color: 'green' },
  AI_ML_DS: { id: 'ai_ml_ds', name: 'AI/ML/DS', fullName: 'AI/ML/Data Science', icon: 'Brain', color: 'pink' },
  DRONE_TECH: { id: 'drone_tech', name: 'Drone Tech', fullName: 'Drone Technology', icon: 'Plane', color: 'cyan' },
  BIOTECHNOLOGY: { id: 'biotechnology', name: 'Biotechnology', fullName: 'Biotechnology', icon: 'Dna', color: 'lime' },
  PHARMA_TECH: { id: 'pharma_tech', name: 'Pharma Tech', fullName: 'Pharmaceutical Technology', icon: 'Pill', color: 'rose' },
  GAMING: { id: 'gaming', name: 'Gaming', fullName: 'Gaming & Game Development', icon: 'Gamepad2', color: 'orange' },
  VR_AR: { id: 'vr_ar_immersive', name: 'VR/AR', fullName: 'VR/AR/Immersive Tech', icon: 'Glasses', color: 'violet' },
  CYBERSECURITY: { id: 'cybersecurity', name: 'CyberSecurity', fullName: 'Cybersecurity', icon: 'Shield', color: 'red' },
  WEB_DEV: { id: 'web_dev', name: 'Web Development', fullName: 'Web Development (Full-stack + AI)', icon: 'Code', color: 'yellow' },
  THREE_D_PRINTING: { id: '3d_printing', name: '3D Printing', fullName: '3D Printing / Additive Manufacturing', icon: 'Box', color: 'indigo' },
  QUANTUM: { id: 'quantum_computing', name: 'Quantum Computing', fullName: 'Quantum Computing', icon: 'Atom', color: 'fuchsia' }
};

export class MultiDomainAssessmentService {
  /**
   * Get all available domains for selection
   */
  static async getAllDomains() {
    try {
      const response = await ApiClient.get('/fields');
      if (response && response.data && response.data.length > 0) {
        return response.data;
      }
      return Object.values(DOMAINS);
    } catch (error) {
      console.warn('API call failed, falling back to static domains:', error.message);
      return Object.values(DOMAINS);
    }
  }

  /**
   * Get question count for each domain
   */
  static async getDomainQuestionCounts() {
    try {
      const response = await ApiClient.get('/questions');
      const counts = {};
      if (response && response.data) {
        response.data.forEach(q => {
          counts[q.category] = (counts[q.category] || 0) + 1;
        });
      }
      return counts;
    } catch (error) {
      console.warn('API call failed for question counts:', error.message);
      return {};
    }
  }

  /**
   * Validate domain selection (minimum 1 domain required)
   */
  static validateDomainSelection(selectedDomains) {
    if (!selectedDomains || selectedDomains.length === 0) {
      return {
        valid: false,
        error: 'Please select at least one domain'
      };
    }

    if (selectedDomains.length > 13) {
      return {
        valid: false,
        error: 'Maximum 13 domains can be selected'
      };
    }

    return { valid: true };
  }

  /**
   * Calculate adaptive difficulty distribution based on selected domains
   */
  static calculateAdaptiveDifficulty(selectedDomains, totalQuestions = 10) {
    const domainCount = selectedDomains.length;
    let difficultyDistribution = {};

    if (domainCount === 1) {
      difficultyDistribution = {
        easy: Math.floor(totalQuestions * 0.2),
        medium: Math.floor(totalQuestions * 0.5),
        hard: Math.ceil(totalQuestions * 0.3)
      };
    } else if (domainCount === 2) {
      difficultyDistribution = {
        easy: Math.floor(totalQuestions * 0.3),
        medium: Math.floor(totalQuestions * 0.5),
        hard: Math.ceil(totalQuestions * 0.2)
      };
    } else if (domainCount <= 4) {
      difficultyDistribution = {
        easy: Math.floor(totalQuestions * 0.4),
        medium: Math.floor(totalQuestions * 0.4),
        hard: Math.ceil(totalQuestions * 0.2)
      };
    } else {
      difficultyDistribution = {
        easy: Math.floor(totalQuestions * 0.5),
        medium: Math.floor(totalQuestions * 0.4),
        hard: Math.ceil(totalQuestions * 0.1)
      };
    }

    const sum = difficultyDistribution.easy + difficultyDistribution.medium + difficultyDistribution.hard;
    if (sum < totalQuestions) {
      difficultyDistribution.medium += (totalQuestions - sum);
    }

    return difficultyDistribution;
  }

  /**
   * Calculate how many questions to pull from each domain
   */
  static calculateDomainDistribution(selectedDomains, totalQuestions = 10) {
    const domainCount = selectedDomains.length;
    const basePerDomain = Math.floor(totalQuestions / domainCount);
    let remainder = totalQuestions % domainCount;

    const distribution = {};
    selectedDomains.forEach((domain, index) => {
      distribution[domain] = basePerDomain + (index < remainder ? 1 : 0);
    });

    return distribution;
  }

  /**
   * Generate multi-domain assessment
   */
  static async generateMultiDomainAssessment(selectedDomains, totalQuestions = 10, userId = null) {
    const validation = this.validateDomainSelection(selectedDomains);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      const response = await ApiClient.post('/questions/multi-domain', {
        domains: selectedDomains,
        totalQuestions
      });

      if (response && response.data && response.data.length > 0) {
        return {
          questions: response.data,
          metadata: {
            selectedDomains,
            domainCount: selectedDomains.length,
            totalQuestions: response.data.length,
            difficultyDistribution: this.calculateAdaptiveDifficulty(selectedDomains, totalQuestions),
            domainDistribution: this.calculateDomainDistribution(selectedDomains, totalQuestions),
            adaptiveLevel: this.getAdaptiveLevel(selectedDomains.length),
            generatedAt: new Date().toISOString(),
            userId
          }
        };
      }
    } catch (error) {
      console.warn('Backend API call failed, falling back to static questions generator:', error.message);
    }

    // Fallback static question generation
    const difficultyDist = this.calculateAdaptiveDifficulty(selectedDomains, totalQuestions);
    const domainDist = this.calculateDomainDistribution(selectedDomains, totalQuestions);

    return {
      questions: [],
      metadata: {
        selectedDomains,
        domainCount: selectedDomains.length,
        totalQuestions,
        difficultyDistribution: difficultyDist,
        domainDistribution: domainDist,
        adaptiveLevel: this.getAdaptiveLevel(selectedDomains.length),
        generatedAt: new Date().toISOString(),
        userId
      }
    };
  }

  static getAdaptiveLevel(domainCount) {
    if (domainCount === 1) return 'Depth Focus (Advanced)';
    if (domainCount <= 3) return 'Balanced (Intermediate)';
    return 'Breadth Focus (Comprehensive)';
  }

  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export default MultiDomainAssessmentService;
