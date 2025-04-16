export const useNavigationState = () => {
  const isNavOpen = useState<boolean>('isNavOpen', () => false);

  const openNav = () => {
    isNavOpen.value = true;
  };

  const closeNav = () => {
    isNavOpen.value = false;
  };

  return {
    isNavOpen,
    openNav,
    closeNav,
  };
};
