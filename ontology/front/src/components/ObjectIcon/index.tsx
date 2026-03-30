import {
  IconDockerHubColor,
  IconDocumentDetailColor,
  IconFunctionColor,
  IconStorageColor,
  IconUserColor,
  IconDataResDirColor,
} from 'modo-design/icon';
import React from 'react';

type ComponentMappingKey = string;

interface ObjectIconProps {
  icon: ComponentMappingKey;
}

// 使用更宽松的 Record 类型定义映射
const componentMapping: Record<string, React.ReactElement> = {
  'IconUserColor-primary': <IconUserColor style={{ color: 'var(--color-primary-6)' }} />,
  'IconUserColor-orangered': <IconUserColor style={{ color: 'var(--color-orangered-6)' }} />,
  'IconUserColor-cyan': <IconUserColor style={{ color: 'var(--color-cyan-6)' }} />,
  'IconUserColor-purple': <IconUserColor style={{ color: 'var(--color-purple-6)' }} />,
  'IconFunctionColor-primary': <IconFunctionColor style={{ color: 'var(--color-primary-6)' }} />,
  'IconFunctionColor-orangered': (
    <IconFunctionColor style={{ color: 'var(--color-orangered-6)' }} />
  ),
  'IconFunctionColor-cyan': <IconFunctionColor style={{ color: 'var(--color-cyan-6)' }} />,
  'IconFunctionColor-purple': <IconFunctionColor style={{ color: 'var(--color-purple-6)' }} />,
  'IconStorageColor-primary': <IconStorageColor style={{ color: 'var(--color-primary-6)' }} />,
  'IconStorageColor-orangered': <IconStorageColor style={{ color: 'var(--color-orangered-6)' }} />,
  'IconStorageColor-cyan': <IconStorageColor style={{ color: 'var(--color-cyan-6)' }} />,
  'IconStorageColor-purple': <IconStorageColor style={{ color: 'var(--color-purple-6)' }} />,
  'IconDockerHubColor-primary': <IconDockerHubColor style={{ color: 'var(--color-primary-6)' }} />,
  'IconDockerHubColor-orangered': (
    <IconDockerHubColor style={{ color: 'var(--color-orangered-6)' }} />
  ),
  'IconDockerHubColor-cyan': <IconDockerHubColor style={{ color: 'var(--color-cyan-6)' }} />,
  'IconDockerHubColor-purple': <IconDockerHubColor style={{ color: 'var(--color-purple-6)' }} />,
  'IconDocumentDetailColor-primary': (
    <IconDocumentDetailColor style={{ color: 'var(--color-primary-6)' }} />
  ),
  'IconDocumentDetailColor-orangered': (
    <IconDocumentDetailColor style={{ color: 'var(--color-orangered-6)' }} />
  ),
  'IconDocumentDetailColor-cyan': (
    <IconDocumentDetailColor style={{ color: 'var(--color-cyan-6)' }} />
  ),
  'IconDocumentDetailColor-purple': (
    <IconDocumentDetailColor style={{ color: 'var(--color-purple-6)' }} />
  ),

  'IconDataResDirColor-primary': (
    <IconDataResDirColor style={{ color: 'var(--color-primary-6)' }} />
  ),
  'IconDataResDirColor-orangered': (
    <IconDataResDirColor style={{ color: 'var(--color-orangered-6)' }} />
  ),
  'IconDataResDirColor-cyan': <IconDataResDirColor style={{ color: 'var(--color-cyan-6)' }} />,
  'IconDataResDirColor-purple': <IconDataResDirColor style={{ color: 'var(--color-purple-6)' }} />,
};

const SelectedComponent = (option: string): React.ReactElement => {
  return componentMapping[option] || <IconDataResDirColor />;
};

const ObjectIcon: React.FC<ObjectIconProps> = ({ icon }) => {
  return SelectedComponent(icon);
};

export default ObjectIcon;
