import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { useReelStore } from '../../stores/useReelStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatRelative } from '../../utils/formatters';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import type { ReelComment, User } from '../../types/models';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

interface Props {
  visible: boolean;
  reelId: string | null;
  commentsCount: number;
  onClose: () => void;
}

export const ReelCommentsSheet: React.FC<Props> = ({ visible, reelId, commentsCount, onClose }) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const user = useAuthStore((s) => s.user);
  const { comments, commentsLoading, commentsPagination, fetchComments, addComment, clearComments } =
    useReelStore();

  useEffect(() => {
    if (visible && reelId) {
      clearComments();
      fetchComments(reelId, 1);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, reelId]);

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose]);

  const handleLoadMore = useCallback(() => {
    if (!reelId || commentsLoading || commentsPagination.page >= commentsPagination.pages) return;
    fetchComments(reelId, commentsPagination.page + 1);
  }, [reelId, commentsLoading, commentsPagination, fetchComments]);

  const handleSend = useCallback(async () => {
    if (!reelId || !text.trim() || isSending) return;
    const content = text.trim();
    setText('');
    setIsSending(true);
    try {
      await addComment(reelId, content);
    } catch {
      setText(content); // restore on failure
    } finally {
      setIsSending(false);
    }
  }, [reelId, text, isSending, addComment]);

  const renderComment = useCallback(({ item }: { item: ReelComment }) => {
    const author = typeof item.author === 'object' ? (item.author as User) : null;
    return (
      <View style={styles.commentRow}>
        <Avatar uri={author?.avatar} name={author?.name ?? '?'} size={34} />
        <View style={styles.commentBody}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentAuthor}>{author?.name ?? 'Unknown'}</Text>
            <Text style={styles.commentContent}>{item.content}</Text>
          </View>
          <Text style={styles.commentTime}>{formatRelative(item.createdAt)}</Text>
        </View>
      </View>
    );
  }, []);

  const renderEmpty = useCallback(() => {
    if (commentsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={40} color={colors.text.light} />
        <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
      </View>
    );
  }, [commentsLoading]);

  const renderFooter = useCallback(() => {
    if (!commentsLoading || comments.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary.yellow} />
      </View>
    );
  }, [commentsLoading, comments.length]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Comments{commentsCount > 0 ? ` (${commentsCount})` : ''}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Comment list */}
          {commentsLoading && comments.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.yellow} />
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderFooter}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Input bar */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[styles.inputRow, { paddingBottom: Math.max(bottomInset, spacing.sm) }]}>
              <Avatar uri={user?.avatar} name={user?.name ?? '?'} size={32} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor={colors.text.light}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!text.trim() || isSending}
                style={[styles.sendButton, (!text.trim() || isSending) && styles.sendButtonDisabled]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.text.onPrimary} />
                ) : (
                  <Ionicons name="send" size={16} color={colors.text.onPrimary} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: colors.background.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.gray,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  commentBody: {
    flex: 1,
    gap: spacing.xs,
  },
  commentBubble: {
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentAuthor: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.text.primary,
    marginBottom: 2,
  },
  commentContent: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  commentTime: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.text.light,
    paddingLeft: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.light,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.white,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 80,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
