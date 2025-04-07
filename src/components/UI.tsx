import React from 'react';
import styled from 'styled-components';
import { UIProps } from '../types';
import { theme } from '../styles/theme';

const UIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  z-index: 10;
`;

const Controls = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
`;

const Button = styled.button`
  background-color: ${theme.colors.ui.background};
  color: white;
  border: 1px solid ${theme.colors.ui.border};
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
    border-color: ${theme.colors.ui.borderHover};
  }
`;

const UI: React.FC<UIProps> = ({ debug, setDebug }) => {
  return (
    <UIOverlay>
      <Controls>
        <Button onClick={() => setDebug(!debug)}>
          {debug ? 'Hide Debug' : 'Show Debug'}
        </Button>
      </Controls>
    </UIOverlay>
  );
};

export default UI;
