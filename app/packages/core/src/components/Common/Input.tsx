import { useTheme } from "@fiftyone/components";
import React, { forwardRef } from "react";
import styled from "styled-components";

const StyledInputContainer = styled.div`
  font-size: 14px;
  border-bottom: 1px ${({ theme }) => theme.primary.plainColor} solid;
  position: relative;
  margin: 0.5rem 0;
`;

const StyledInput = styled.input`
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.primary.plainColor};
  height: 2rem;
  font-size: 14px;
  border: none;
  align-items: center;
  font-weight: bold;
  width: 100%;

  &:focus {
    border: none;
    outline: none;
    font-weight: bold;
  }

  &::placeholder {
    color: ${({ theme }) => theme.text.secondary};
    font-weight: bold;
  }
`;

interface BaseProps {
  color?: string;
  placeholder?: string;
  onEnter?: () => void;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
  title?: string;
}
interface InputProps extends BaseProps {
  validator?: (value: string) => boolean;
  setter: (value: string) => void;
  value: string;
}

interface NumberInputProps extends BaseProps {
  validator?: (value: number) => boolean;
  setter: (value: number) => void;
  value: number;
  min?: number;
  max?: number;
  step?: number;
}

const Input = React.memo(
  forwardRef(
    (
      {
        color = undefined,
        placeholder,
        validator = () => true,
        setter,
        value,
        disabled = false,
        onEnter,
        onFocus,
        onBlur,
        onKeyDown,
        style,
        title,
      }: InputProps,
      ref
    ) => {
      const theme = useTheme();
      color = color ?? theme.primary.plainColor;

      return (
        <StyledInputContainer
          style={{ borderBottom: `1px solid ${color}`, ...style }}
        >
          <StyledInput
            ref={ref}
            placeholder={placeholder}
            data-cy={`input-${placeholder}`}
            value={value === null ? "" : String(value)}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              if (validator(e.currentTarget.value)) {
                setter(e.currentTarget.value);
              }
            }}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              e.key === "Enter" && onEnter && onEnter();
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              e.key === "Escape" && e.currentTarget.blur();
              onKeyDown && onKeyDown(e);
            }}
            style={
              disabled
                ? { color: theme.text.secondary, cursor: "not-allowed" }
                : {}
            }
            disabled={disabled}
            onFocus={(_: React.FocusEvent<HTMLInputElement>) => {
              onFocus && onFocus();
            }}
            onBlur={onBlur}
            title={title}
          />
        </StyledInputContainer>
      );
    }
  )
);

export default Input;

export const NumberInput = React.memo(
  forwardRef(
    (
      {
        color = undefined,
        placeholder,
        min,
        max,
        step,
        validator = () => true,
        setter,
        value,
        disabled = false,
        onEnter,
        onFocus,
        onBlur,
        onKeyDown,
        style,
        title,
      }: NumberInputProps,
      ref
    ) => {
      const theme = useTheme();
      color = color ?? theme.primary.plainColor;

      return (
        <StyledInputContainer
          style={{ borderBottom: `1px solid ${color}`, ...style }}
        >
          <StyledInput
            ref={ref}
            type={"number"}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            data-cy={`input-${placeholder}`}
            value={value === null ? "" : Number(value)}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              if (validator(Number(e.currentTarget.value))) {
                setter(Number(e.currentTarget.value));
              }
            }}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              e.key === "Enter" && onEnter && onEnter();
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              e.key === "Escape" && e.currentTarget.blur();
              onKeyDown && onKeyDown(e);
            }}
            style={
              disabled
                ? { color: theme.text.secondary, cursor: "not-allowed" }
                : {}
            }
            disabled={disabled}
            onFocus={(_: React.FocusEvent<HTMLInputElement>) => {
              onFocus && onFocus();
            }}
            onBlur={onBlur}
            title={title}
          />
        </StyledInputContainer>
      );
    }
  )
);
