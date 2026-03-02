import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const MyPreset = definePreset(Aura, {
  semantic: {
    // Переопределяем primary-палитру
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#4a1d0b'
    },
    // Настраиваем, как токены primary будут применяться в компонентах
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',      // Цвет кнопки по умолчанию
          contrastColor: '#ffffff',     // Цвет текста на кнопке
          hoverColor: '{primary.600}',  // Цвет при наведении
          activeColor: '{primary.700}'  // Цвет при нажатии
        }
      }
      // При необходимости можно добавить секцию dark для темной темы
    }
  }
});
