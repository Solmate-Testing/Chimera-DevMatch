import { useReducer } from "react";

type ActionType =
  | {
      type: "SET_SHOW_ANIMATION";
      showAnimation: boolean;
    }
  | {
      type: "SET_IS_LOADING_BALANCE";
      isLoadingBalance: boolean;
    };

type StateType = {
  showAnimation: boolean;
  isLoadingBalance: boolean;
};

const initialState: StateType = {
  showAnimation: false,
  isLoadingBalance: false,
};

const reducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case "SET_SHOW_ANIMATION":
      return { ...state, showAnimation: action.showAnimation };
    case "SET_IS_LOADING_BALANCE":
      return { ...state, isLoadingBalance: action.isLoadingBalance };
    default:
      return state;
  }
};

/**
 * Custom hook to manage animation state for balance displays and transactions
 */
export const useAnimationConfig = () => {
  const [animationData, dispatch] = useReducer(reducer, initialState);

  const setShowAnimation = (show: boolean) => {
    dispatch({ type: "SET_SHOW_ANIMATION", showAnimation: show });
  };

  const setIsLoadingBalance = (loading: boolean) => {
    dispatch({ type: "SET_IS_LOADING_BALANCE", isLoadingBalance: loading });
  };

  return {
    showAnimation: animationData.showAnimation,
    isLoadingBalance: animationData.isLoadingBalance,
    setShowAnimation,
    setIsLoadingBalance,
  };
};