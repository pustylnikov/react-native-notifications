import React, {FC, RefObject, useRef} from 'react';
import {Button, SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {AnimationMethods, AnimationTypes, NotificationContainer, SwipeTypes} from '../src';

const TITLE_1 = '📨 Notification title';
const TEXT_1 = 'Ut ac odio nunc. Nulla pellentesque blandit elit, ut commodo ante condimentum pulvinar. Nam convallis neque sit amet dolor placerat venenatis. Etiam ac aliquet justo.';

const Notification: FC<{ title: string, text: string }> = ({title, text}) => (
    <>
        <SafeAreaView style={styles.safeAreaView}/>
        <View style={styles.notificationView}>
            <Text style={styles.notificationTitle}>{title}</Text>
            <Text style={styles.notificationText}>{text}</Text>
        </View>
    </>
);

const App = () => {

    const notificationRef: RefObject<NotificationContainer> = useRef(null);

    return (
        <>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent"/>
            <SafeAreaView style={styles.safeAreaView}>
                <View style={styles.containerView}>
                    <Text style={styles.titleText}>React Native Notifications </Text>
                    <View style={styles.contentView}>
                        <Button
                            title="Show Notification"
                            onPress={() => {
                                notificationRef.current && notificationRef.current.open({
                                    renderProps: {
                                        title: TITLE_1,
                                        text: TEXT_1,
                                    },
                                });
                            }}
                        />
                    </View>
                </View>
            </SafeAreaView>

            <NotificationContainer
                ref={notificationRef}
                showDuration={300}
                hideDuration={300}
                autoCloseTimeout={2000}
                nextNotificationInterval={100}
                openAnimationTypes={[AnimationTypes.FADE, AnimationTypes.SLIDE_UP]}
                closeAnimationTypes={[AnimationTypes.FADE, AnimationTypes.SLIDE_UP]}
                allowCloseSwipeTypes={[SwipeTypes.SLIDE_UP, SwipeTypes.SLIDE_LEFT, SwipeTypes.SLIDE_RIGHT]}
                animationMethod={AnimationMethods.spring}
                animationOptions={{
                    bounciness: 10,
                }}
                onClose={(props: any) => console.log('OnClose', props)}
                onOpen={(props: any) => console.log('onOpen', props)}
                onPress={(props: any) => console.log('onPress', props)}
                render={(props: any) => {
                    console.log('render notification', props);
                    return <Notification {...props} />;
                }}
            />
        </>
    );
};

const styles = StyleSheet.create({
    containerView: {
        flex: 1,
        padding: 15,
    },
    safeAreaView: {
        flex: 1,
        paddingTop: StatusBar.currentHeight,
    },
    titleText: {
        fontSize: 18,
        color: '#000',
        textAlign: 'center',
    },
    contentView: {
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 20,
    },
    notificationView: {
        marginVertical: 15,
        marginHorizontal: 15,
        borderRadius: 10,
        borderColor: '#ccc',
        borderWidth: 0.5,
        backgroundColor: '#efefef',
        padding: 15,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    notificationText: {
        fontSize: 14,
    },
});

export default App;
