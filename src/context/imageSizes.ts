import { createContext, useContext } from 'react';

const ImageSizeProvider = createContext(null);
ImageSizeProvider.displayName = `ImageSizeProvider`;

export default ImageSizeProvider;

export const useImageSizes = () => {
  return useContext(ImageSizeProvider);
};
