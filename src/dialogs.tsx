import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, useColorScheme, View, type AlertButton, type AlertOptions } from 'react-native';
import { NText } from './ui';

type DialogRequest = { title: string; message?: string; buttons?: AlertButton[]; options?: AlertOptions };
let presentDialog: ((request: DialogRequest) => void) | undefined;

/** Drop-in replacement for Alert.alert, including onPress and destructive/cancel actions. */
export function nobinAlert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
  const request: DialogRequest = { title: String(title ?? ''), message, buttons, options };
  if (presentDialog) { presentDialog(request); return; }
  // Preserve a usable native fallback before the app root has mounted.
  Alert.alert(request.title, request.message, request.buttons, request.options);
}

function isSecondary(button: AlertButton) {
  return button.style === 'cancel' || /^(انصراف|لغو|خیر|بعداً|بستن|بازگشت)$/.test((button.text || '').trim());
}

export function NobinDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const dark = useColorScheme() === 'dark';
  useEffect(() => {
    const listener = (next: DialogRequest) => setRequest(next);
    presentDialog = listener;
    return () => { if (presentDialog === listener) presentDialog = undefined; };
  }, []);

  const buttons = request?.buttons?.length ? request.buttons : [{ text: 'متوجه شدم' }];
  const title = request?.title || 'پیام نوبین';
  const destructive = buttons.some(x => x.style === 'destructive');
  const failure = /خطا|نشد|ناموفق|اشتباه|مشکل/.test(title);
  const success = /موفق|ذخیره شد|ثبت شد|انجام شد/.test(title);
  const confirmation = buttons.length > 1 && !success && !failure;
  const iconName = failure ? 'alert-circle' : destructive ? 'warning' : confirmation ? 'help-circle' : success ? 'checkmark-circle' : 'information-circle';
  const accent = failure || destructive ? '#C4474B' : success ? '#0F8A68' : '#812653';
  const surface = dark ? '#26252B' : '#FFFFFF';
  const primaryText = dark ? '#F8F6F8' : '#25202A';
  const secondaryText = dark ? '#D5CED8' : '#6F6671';

  const dismiss = (button?: AlertButton) => {
    setRequest(null);
    if (button?.onPress) { button.onPress(); }
  };
  const cancelButton = buttons.find(isSecondary);
  const canDismiss = !!request?.options?.cancelable || !!cancelButton;
  return <>
    {children}
    <Modal
      visible={!!request}
      transparent
      animationType="fade"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={() => { if (canDismiss) dismiss(cancelButton); }}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={() => { if (canDismiss) dismiss(cancelButton); }} />
        <View style={[styles.dialog, { backgroundColor: surface }]} accessibilityViewIsModal>
          <View style={[styles.symbol, { backgroundColor: accent + '15' }]}>
            <Ionicons name={iconName as any} size={29} color={accent} />
          </View>
          <NText weight="bold" accessibilityRole="header" style={[styles.title, { color: primaryText }]}>{title}</NText>
          {request?.message ? <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageArea} showsVerticalScrollIndicator={false}>
            <NText style={[styles.message, { color: secondaryText }]}>{request.message}</NText>
          </ScrollView> : null}
          <View style={[styles.actions, buttons.length > 2 && styles.actionsVertical]}>
            {buttons.map((button, i) => {
              const muted = isSecondary(button);
              const main = !muted && (buttons.length === 1 || buttons.findIndex(b => !isSecondary(b)) === i);
              const actionColor = button.style === 'destructive' ? '#C4474B' : accent;
              return <Pressable
                key={String(i)}
                accessibilityRole="button"
                accessibilityLabel={button.text || 'تأیید'}
                onPress={() => dismiss(button)}
                style={({ pressed }) => [
                  styles.action,
                  buttons.length <= 2 && { flex: 1 },
                  {
                    backgroundColor: main ? actionColor : (dark ? '#353039' : '#F7F2F5'),
                    borderColor: main ? actionColor : (dark ? '#4D4451' : '#E9DFE6'),
                    opacity: pressed ? .78 : 1
                  }
                ]}
              >
                <NText weight="semi" style={[styles.actionText, { color: main ? '#FFFFFF' : primaryText }]}>
                  {button.text || 'تأیید'}
                </NText>
              </Pressable>;
            })}
          </View>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(21, 14, 24, 0.56)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  dialog: { width: '100%', maxWidth: 430, borderRadius: 26, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 20, alignItems: 'center', elevation: 15, shadowColor: '#000', shadowOpacity: .20, shadowRadius: 28, shadowOffset: { width: 0, height: 12 } },
  symbol: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 18, lineHeight: 30, textAlign: 'center', paddingHorizontal: 8 },
  messageScroll: { maxHeight: 230, alignSelf: 'stretch', marginTop: 8 },
  messageArea: { paddingBottom: 4, paddingHorizontal: 2 },
  message: { fontSize: 13.2, lineHeight: 25, textAlign: 'center', writingDirection: 'rtl' },
  actions: { width: '100%', flexDirection: 'row-reverse', gap: 10, marginTop: 22 },
  actionsVertical: { flexDirection: 'column' },
  action: { minHeight: 49, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12.8, lineHeight: 23, textAlign: 'center' }
});
