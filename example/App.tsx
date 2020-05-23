import React, {FC} from 'react';
import {Button, SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {AnimationMethods, AnimationTypes, NotificationContainer, SwipeTypes} from '../src';
import {closeAllNotifications, closeNotification, openNotification, setNotificationsRef} from '../src/helper';

const TITLE_1 = '📨 Notification title';
const TEXT_1 = 'Ut ac odio nunc. Nulla pellentesque blandit elit, ut commodo ante condimentum pulvinar. Nam convallis neque sit amet dolor placerat venenatis. Etiam ac aliquet justo.';

const TITLE_2 = '📨 Notification title 2';
const TEXT_2 = 'Donec sit amet suscipit erat. Aenean in ex ultricies, sagittis velit quis, lacinia mi. Mauris euismod, mauris eget laoreet ultricies, purus urna blandit arcu, at condimentum turpis nisl vel enim. Integer pellentesque, quam et elementum tincidunt, nisi nisl gravida augue, lacinia porttitor odio quam pulvinar arcu.';

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
    return (
        <>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent"/>
            <SafeAreaView style={styles.safeAreaView}>
                <View style={styles.containerView}>
                    <Text style={styles.titleText}>React Native Notifications</Text>
                    <View style={styles.contentView}>
                        <View style={styles.buttonView}>
                            <Button
                                title="Show Notification"
                                onPress={() => {
                                    openNotification({
                                        render: () => <Notification title={TITLE_1} text={TEXT_1}/>,
                                    });
                                }}
                            />
                        </View>

                        <View style={styles.buttonView}>
                            <Button
                                title="Show Notification with extra params"
                                onPress={() => {
                                    openNotification({
                                        render: () => <Notification title={TITLE_2} text={TEXT_2}/>,
                                        onOpen: () => console.log('On open notify'),
                                        onPress: () => console.log('On press notify'),
                                        onClose: () => console.log('On close notify'),
                                        animationMethod: AnimationMethods.timing,
                                        autoCloseTimeout: 5000,
                                        enableOnPressAnimation: false,
                                    });
                                }}
                            />
                        </View>

                        <View style={styles.buttonView}>
                            <Button
                                title="Close Notification"
                                onPress={() => {
                                    closeNotification();
                                }}
                            />
                        </View>

                        <View style={styles.buttonView}>
                            <Button
                                title="Close All Notifications"
                                onPress={() => {
                                    closeAllNotifications();
                                }}
                            />
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            <NotificationContainer
                ref={setNotificationsRef}
                openDuration={300}
                closeDuration={300}
                autoCloseTimeout={2000}
                nextNotificationInterval={100}
                enableOnPressAnimation
                openAnimationTypes={[AnimationTypes.FADE, AnimationTypes.SLIDE_UP]}
                closeAnimationTypes={[AnimationTypes.FADE, AnimationTypes.SLIDE_UP]}
                allowCloseSwipeTypes={[SwipeTypes.SLIDE_UP, SwipeTypes.SLIDE_LEFT, SwipeTypes.SLIDE_RIGHT]}
                animationMethod={AnimationMethods.spring}
                animationOptions={{
                    bounciness: 10,
                }}
                onClose={() => console.log('OnClose')}
                onOpen={() => console.log('onOpen')}
                onPress={() => console.log('onPress')}
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
    buttonView: {
        marginVertical: 10,
    },
});

export default App;
