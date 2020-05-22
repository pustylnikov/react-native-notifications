![preview](https://github.com/pustylnikov/react-native-notifications/blob/master/readme/preview.gif?raw=true)

### Install
using npm
```
npm install @anvilapp/react-native-notifications --save
```
or using yarn
```
yarn add @anvilapp/react-native-notifications
```

[See the full usage example here.](https://github.com/pustylnikov/react-native-notifications/blob/master/example/App.tsx)

### Usage example
```javascript
import { NotificationContainer } from '@anvilapp/react-native-notifications';

const notificationsRef = React.createRef();

<NotificationContainer
    ref={notificationRef}
    render={({title, text}) => (
        <View style={styles.notification}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.text}>{text}</Text>
        </View>
    )}
/>

// Show notification
notificationRef.current.open({
    renderProps: {
        title: 'Title',
        text: 'Text',
    },
});
```
