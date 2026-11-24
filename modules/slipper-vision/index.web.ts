import type { ComponentType } from 'react';
import { View, type ViewProps } from 'react-native';

type SlipperVision = {
  photoDistance(a: string, b: string): Promise<number>;
};

const SlipperVisionWeb: SlipperVision | null = null;
export default SlipperVisionWeb;

export type SquatCameraProps = ViewProps & {
  downAngle: number;
  upAngle: number;
  minVisibility: number;
  minRepSec: number;
  maxRepSec: number;
  active: boolean;
  onPose?: (event: { nativeEvent: { visible: boolean; angle?: number } }) => void;
  onRep?: () => void;
};

// 네이티브 카메라는 웹 미리보기에서 사용할 수 없으므로 일반 View로 자리를 유지해요.
export const SquatCamera = View as unknown as ComponentType<SquatCameraProps>;
