import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface HeaderState {
  title: string;
  showLeftAction: boolean;
  showRightAction: boolean;
  leftActionHandler: (() => void) | null;
  rightActionHandler: (() => void) | null;
}

export function useHeaderState() {
  const headerState = useState<HeaderState>('header-state', () => ({
    title: '',
    showLeftAction: false,
    showRightAction: false,
    leftActionHandler: null,
    rightActionHandler: null,
  }));

  const route = useRoute();
  const router = useRouter();

  const defaultLeftAction = () => router.push('/app');

  const setHeader = (config: Partial<HeaderState>) => {
    headerState.value = {
      title: '',
      showLeftAction: false,
      showRightAction: false,
      leftActionHandler: null,
      rightActionHandler: null,
      ...config,
    };
  };

  const resetHeader = () => {
    headerState.value = {
      title: '',
      showLeftAction: false,
      showRightAction: false,
      leftActionHandler: null,
      rightActionHandler: null,
    };
  };

  return {
    headerState,
    setHeader,
    resetHeader,
    defaultLeftAction,
  };
}
