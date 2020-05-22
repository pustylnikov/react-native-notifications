import React from 'react';
import {View, SafeAreaView, StatusBar, StyleSheet, Text, Button} from 'react-native';

const App = () => {
    return (
        <>
            <StatusBar barStyle="dark-content"/>
            <SafeAreaView/>
            <View style={styles.containerView}>
                <Text style={styles.titleText}>React Native Notifications </Text>
                <View style={styles.contentView}>
                    <Button
                        title="Show first notification"
                        onPress={() => {
                            // TODO
                        }}
                    />
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    containerView: {
        flex: 1,
        padding: 15,
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
});

export default App;
