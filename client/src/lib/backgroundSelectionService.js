import ApiClient from './apiClient';

export const backgroundSelectionService = {
  async saveBackgroundSelection(selection, userId = null) {
    try {
      const user_id = userId || localStorage.getItem('guest_user_id') || `user_${Date.now()}`;
      localStorage.setItem('guest_user_id', user_id);

      const payload = {
        user_id,
        field_of_study: selection.fieldOfStudy,
        intake_data: {
          class_level: selection.classLevel,
          learning_goals: selection.learningGoals,
          updated_at: new Date().toISOString()
        }
      };

      try {
        const response = await ApiClient.post('/students/intake', payload);
        if (response && response.data) {
          localStorage.setItem('background_selection', JSON.stringify(selection));
          return response.data;
        }
      } catch (apiErr) {
        console.warn('API save background failed, storing locally:', apiErr.message);
      }

      localStorage.setItem('background_selection', JSON.stringify(selection));
      return payload;
    } catch (error) {
      console.error('Error saving background selection:', error);
      localStorage.setItem('background_selection', JSON.stringify(selection));
      return selection;
    }
  },

  async getBackgroundSelection(userId = null) {
    try {
      const user_id = userId || localStorage.getItem('guest_user_id');
      if (user_id) {
        try {
          const response = await ApiClient.get(`/students/profile/${user_id}`);
          if (response && response.data && response.data.intake_data) {
            return {
              fieldOfStudy: response.data.field_of_study,
              classLevel: response.data.intake_data.class_level,
              learningGoals: response.data.intake_data.learning_goals
            };
          }
        } catch (apiErr) {
          console.warn('API get background failed, reading local storage:', apiErr.message);
        }
      }

      const local = localStorage.getItem('background_selection');
      return local ? JSON.parse(local) : null;
    } catch (error) {
      console.error('Error getting background selection:', error);
      const local = localStorage.getItem('background_selection');
      return local ? JSON.parse(local) : null;
    }
  }
};