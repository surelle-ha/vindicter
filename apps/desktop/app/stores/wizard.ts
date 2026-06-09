import { defineStore } from 'pinia'
import type { EditorSlug, AIToolSlug, ProjectType } from '~/types/vindicta'

export const useWizardStore = defineStore('wizard', {
  state: () => ({
    open: false,
    currentStep: 0,
    totalSteps: 1,
    selectedPath: null as string | null,
    projectName: '',
    projectDescription: '',
    projectCode: '',
    projectType: null as ProjectType | null,
    selectedEditor: null as EditorSlug | null,
    selectedAITools: ['codex'] as AIToolSlug[],
    importMode: 'local' as 'local' | 'clone' | 'new' | 'github',
    gitUrl: '',
    cloning: false,
    cloneError: '',
  }),

  getters: {
    canProceed: (s) => {
      return !!s.selectedPath && !!s.projectName.trim()
    },
    isFirstStep: (s) => s.currentStep === 0,
    isLastStep: (s) => s.currentStep === s.totalSteps - 1,
    progress: (s) => Math.round(((s.currentStep + 1) / s.totalSteps) * 100),
  },

  actions: {
    openWizard() {
      this.reset()
      this.open = true
    },
    closeWizard() {
      this.open = false
    },
    next() {
      if (this.currentStep < this.totalSteps - 1) this.currentStep++
    },
    back() {
      if (this.currentStep > 0) this.currentStep--
    },
    reset() {
      this.currentStep = 0
      this.selectedPath = null
      this.projectName = ''
      this.projectDescription = ''
      this.projectCode = ''
      this.projectType = null
      this.selectedEditor = null
      this.selectedAITools = ['codex']
      this.importMode = 'local'
      this.gitUrl = ''
      this.cloning = false
      this.cloneError = ''
    },
  },
})
