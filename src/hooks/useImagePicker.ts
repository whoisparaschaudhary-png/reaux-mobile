import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { showAppAlert } from '../stores/useUIStore';

interface PickedImage {
  uri: string;
  type: string;
  fileName: string;
}

export function useImagePicker() {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const _launchGallery = async (): Promise<PickedImage | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAppAlert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      return { uri: asset.uri, type: asset.mimeType || 'image/jpeg', fileName: asset.fileName || 'photo.jpg' };
    }
    return null;
  };

  const _launchCamera = async (): Promise<PickedImage | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAppAlert('Permission needed', 'Please grant camera permissions to take photos.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      return { uri: asset.uri, type: asset.mimeType || 'image/jpeg', fileName: asset.fileName || 'photo.jpg' };
    }
    return null;
  };

  const pickImage = async () => {
    setIsLoading(true);
    try {
      const picked = await _launchGallery();
      if (picked) setImage(picked);
      return picked;
    } finally {
      setIsLoading(false);
    }
  };

  const pickImageWithCamera = (): Promise<PickedImage | null> => {
    return new Promise((resolve) => {
      Alert.alert('Add Photo', 'Choose a source', [
        {
          text: 'Camera',
          onPress: async () => {
            setIsLoading(true);
            try {
              const picked = await _launchCamera();
              if (picked) setImage(picked);
              resolve(picked);
            } finally {
              setIsLoading(false);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            setIsLoading(true);
            try {
              const picked = await _launchGallery();
              if (picked) setImage(picked);
              resolve(picked);
            } finally {
              setIsLoading(false);
            }
          },
        },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });
  };

  const clearImage = () => setImage(null);

  return { image, pickImage, pickImageWithCamera, clearImage, isLoading };
}
