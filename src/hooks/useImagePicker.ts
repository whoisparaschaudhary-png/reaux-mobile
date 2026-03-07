import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { showAppAlert } from '../stores/useUIStore';

interface PickedImage {
  uri: string;
  type: string;
  fileName: string;
}

export function useImagePicker() {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAppAlert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return null;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const picked = {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || 'photo.jpg',
        };
        setImage(picked);
        return picked;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => setImage(null);

  return { image, pickImage, clearImage, isLoading };
}
