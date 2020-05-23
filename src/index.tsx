import React, {Component, ReactNode} from 'react';
import {
    Animated,
    View,
    StyleSheet,
    Dimensions,
    PanResponder,
    PanResponderInstance,
} from 'react-native';

type AnyObject = { [key: string]: any };

export enum AnimationTypes {
    FADE = 'fade',
    SLIDE_UP = 'slide-up',
    SLIDE_LEFT = 'slide-left',
    SLIDE_RIGHT = 'slide-right',
}

export enum SwipeTypes {
    SLIDE_UP = 'slide-up',
    SLIDE_LEFT = 'slide-left',
    SLIDE_RIGHT = 'slide-right',
}

enum SwipeDirections {
    Y = 'y',
    X = 'x',
}

export enum AnimationMethods {
    timing = 'timing',
    spring = 'spring',
}

export type AnimationConfig = Partial<Animated.TimingAnimationConfig> | Partial<Animated.SpringAnimationConfig>;

export type Notification = {
    render: () => ReactNode
    openDuration?: number
    closeDuration?: number
    nextNotificationInterval?: number
    priority?: number
    autoCloseTimeout?: number
    closeSwipeDistance?: number,
    closeSwipeVelocity?: number,
    openAnimationTypes?: AnimationTypes[]
    closeAnimationTypes?: AnimationTypes[]
    allowCloseSwipeTypes?: SwipeTypes[]
    animationMethod?: AnimationMethods
    animationOptions?: AnimationConfig
    enableOnPressAnimation?: boolean
    onClose?: () => void
    onOpen?: () => void
    onPress?: () => void
}

type PreparedNotification = {
    render: () => ReactNode
    openDuration: number
    closeDuration: number
    nextNotificationInterval: number
    priority: number
    autoCloseTimeout: number
    closeSwipeDistance: number,
    closeSwipeVelocity: number,
    openAnimationTypes: AnimationTypes[]
    closeAnimationTypes: AnimationTypes[]
    allowCloseSwipeTypes: SwipeTypes[]
    animationMethod: AnimationMethods
    animationOptions: AnimationConfig
    enableOnPressAnimation: boolean
    onClose?: () => void
    onOpen?: () => void
    onPress?: () => void
}

export type NotificationContainerProps = {
    openDuration: number
    closeDuration: number
    autoCloseTimeout: number
    nextNotificationInterval: number
    closeSwipeDistance: number,
    closeSwipeVelocity: number,
    enableOnPressAnimation: boolean
    animationMethod: AnimationMethods
    openAnimationTypes: AnimationTypes[]
    closeAnimationTypes: AnimationTypes[]
    allowCloseSwipeTypes: SwipeTypes[]
    animationOptions: AnimationConfig
    onClose?: () => void
    onOpen?: () => void
    onPress?: () => void
    propsAreEqual?: (prevProps: Readonly<NotificationContainerProps>, nextProps: Readonly<NotificationContainerProps>) => boolean
}

type NotificationContainerState = {
    visible: boolean
    closing: boolean
    swipeClosingType: SwipeTypes | null,
    height: number,
}

const {width} = Dimensions.get('window');

export class NotificationContainer extends Component<NotificationContainerProps, NotificationContainerState> {

    static defaultProps: Partial<NotificationContainerProps> = {
        openDuration: 300,
        closeDuration: 300,
        autoCloseTimeout: 0,
        nextNotificationInterval: 100,
        closeSwipeDistance: 0.6,
        closeSwipeVelocity: 0.3,
        openAnimationTypes: [AnimationTypes.FADE, AnimationTypes.SLIDE_UP],
        closeAnimationTypes: [AnimationTypes.FADE, AnimationTypes.SLIDE_UP],
        allowCloseSwipeTypes: [SwipeTypes.SLIDE_UP],
        animationMethod: AnimationMethods.timing,
        animationOptions: {},
        enableOnPressAnimation: true,
    };

    /**
     * Component state
     */
    state: NotificationContainerState = {
        visible: false,
        closing: false,
        swipeClosingType: null,
        height: 150,
    };

    /**
     * Main animation value
     */
    protected animation = new Animated.Value(0);

    /**
     * Drag animation by X
     */
    protected translateX = new Animated.Value(0);

    /**
     * Drag animation by Y
     */
    protected translateY = new Animated.Value(0);

    /**
     * Scale animation
     */
    protected scale = new Animated.Value(1);

    /**
     *
     * @type {Boolean}
     */
    protected isVisible: boolean = false;

    /**
     *
     * @type {Array}
     */
    protected notifications: PreparedNotification[] = [];

    /**
     * Notification properties
     */
    protected notification: PreparedNotification | undefined;

    /**
     * Indicates the mounted component
     */
    protected mount = false;

    /**
     * Auto-closing timeout
     */
    protected timeout: number | null = null;

    /**
     * Notification layout height
     */
    protected height: number = 0;

    /**
     * Swipe direction type
     */
    protected swipeDirection: SwipeDirections | null = null;

    /**
     * Defines to allow height changing
     */
    allowUpdateHeight: boolean = false;

    /**
     * Indicates locked auto-closing
     */
    lockClosing: boolean = false;

    /**
     * Drag responder
     */
    panResponder: PanResponderInstance = PanResponder.create({
        onStartShouldSetPanResponder: () => {
            return !!(this.notification?.onPress);
        },
        onMoveShouldSetPanResponder: () => {
            return !!(this.notification && this.notification.allowCloseSwipeTypes.length > 0);
        },
        onPanResponderGrant: () => {
            this.lockClosing = true;
            this.timeout && clearTimeout(this.timeout);
        },
        onPanResponderMove: (e, gesture) => {
            if (!this.notification) {
                return;
            }
            const {allowCloseSwipeTypes} = this.notification;
            if (!this.swipeDirection) {
                this.swipeDirection = Math.abs(gesture.dx) > Math.abs(gesture.dy) ? SwipeDirections.X : SwipeDirections.Y;
            }
            if (this.swipeDirection === SwipeDirections.X) {
                if (
                    (gesture.dx < 0 && allowCloseSwipeTypes.includes(SwipeTypes.SLIDE_LEFT)) ||
                    (gesture.dx > 0 && allowCloseSwipeTypes.includes(SwipeTypes.SLIDE_RIGHT))
                ) {
                    Animated.event([null, {dx: this.translateX}], {useNativeDriver: false})(e, gesture);
                }
            } else if (gesture.dy < 0) {
                if (allowCloseSwipeTypes.includes(SwipeTypes.SLIDE_UP)) {
                    Animated.event([null, {dy: this.translateY}], {useNativeDriver: false})(e, gesture);
                }
            }
        },
        onPanResponderRelease: (e, gesture) => {
            if (!this.notification) {
                return;
            }
            this.lockClosing = false;
            const absDx = Math.abs(gesture.dx);
            const absDy = Math.abs(gesture.dy);
            const absVx = Math.abs(gesture.vx);
            const absVy = Math.abs(gesture.vy);
            const {
                onPress,
                allowCloseSwipeTypes,
                enableOnPressAnimation,
                closeSwipeVelocity,
                closeSwipeDistance,
            } = this.notification;

            if (absDx <= 1 && absDy <= 1) {
                if (enableOnPressAnimation) {
                    Animated.sequence([
                        Animated.timing(this.scale, {
                            toValue: 1.05,
                            duration: 100,
                            useNativeDriver: false,
                        }),
                        Animated.timing(this.scale, {
                            toValue: 1,
                            duration: 100,
                            useNativeDriver: false,
                        }),
                    ]).start(() => {
                        onPress && onPress();
                        setTimeout(() => {
                            this.close();
                        });
                    });
                } else {
                    onPress && onPress();
                    setTimeout(() => {
                        this.close();
                    });
                }
            } else if (this.swipeDirection === SwipeDirections.X) {
                if (absVx >= closeSwipeVelocity || absDx >= closeSwipeDistance * width) {
                    if (gesture.dx > 0) {
                        allowCloseSwipeTypes.includes(SwipeTypes.SLIDE_RIGHT) && this.close(SwipeTypes.SLIDE_RIGHT);
                    } else {
                        allowCloseSwipeTypes.includes(SwipeTypes.SLIDE_LEFT) && this.close(SwipeTypes.SLIDE_LEFT);
                    }
                } else {
                    Animated.spring(this.translateX, {
                        toValue: 0,
                        bounciness: 10,
                        useNativeDriver: false,
                    }).start(() => {
                        this.startCloseTimeout();
                    });
                }
            } else if (this.swipeDirection === SwipeDirections.Y) {
                if (absVy >= closeSwipeVelocity || absDy >= closeSwipeDistance * this.state.height) {
                    if (gesture.dy < 0) {
                        allowCloseSwipeTypes.includes(SwipeTypes.SLIDE_UP) && this.close(SwipeTypes.SLIDE_UP);
                    }
                } else {
                    Animated.spring(this.translateY, {
                        toValue: 0,
                        bounciness: 10,
                        useNativeDriver: false,
                    }).start(() => {
                        this.startCloseTimeout();
                    });
                }
            }
            this.swipeDirection = null;
        },
    });

    /**
     * @override
     * @param state
     * @param callback
     */
    setState = <K extends keyof NotificationContainerState>(state: Pick<NotificationContainerState, K>, callback?: () => any) => {
        if (this.mount) {
            super.setState(state, callback);
        }
    };

    /**
     * Return animated styles
     */
    protected getAnimationStyles = (): AnyObject => {
        if (!this.notification) {
            return {};
        }
        const {closing, swipeClosingType, height} = this.state;
        const {openAnimationTypes, closeAnimationTypes} = this.notification;
        const types = (() => {
            if (closing) {
                if (swipeClosingType) {
                    return closeAnimationTypes.includes(AnimationTypes.FADE) ? [
                        AnimationTypes.FADE,
                        swipeClosingType,
                    ] : [swipeClosingType];
                }
                return closeAnimationTypes;
            }
            return openAnimationTypes;
        })();

        return types.reduce((styles: AnyObject, type) => {
            switch (type) {
                case AnimationTypes.FADE:
                    styles.opacity = this.animation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0, 1],
                    });
                    break;

                case AnimationTypes.SLIDE_UP:
                    styles.top = this.animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-height, 0],
                    });
                    break;

                case AnimationTypes.SLIDE_RIGHT:
                    styles.left = this.animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [width, 0],
                    });
                    break;

                case AnimationTypes.SLIDE_LEFT:
                    styles.left = this.animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-width, 0],
                    });
                    break;
            }
            return styles;
        }, {});
    };

    /**
     * Open notification
     *
     * @param notification
     */
    public open = (notification: Notification): void => {
        this.notifications.push({
            priority: 0,
            ...this.props,
            ...notification,
        });
        this.notifications.sort((a, b) => b.priority - a.priority);
        this.showNextNotification();
    }

    /**
     * Show notification from queue
     */
    protected showNextNotification = (): void => {
        if (this.isVisible) {
            return;
        }

        this.timeout && clearTimeout(this.timeout);

        const notification = this.notifications.shift();

        if (notification) {
            this.notification = notification;
        } else {
            return;
        }

        this.translateX.setValue(0);
        this.translateY.setValue(0);
        this.isVisible = true;
        this.allowUpdateHeight = true;

        this.animation.stopAnimation(() => {
            this.setState({
                visible: true,
                swipeClosingType: null,
                closing: false,
            });
        });
    };

    /**
     * Run opening animation
     */
    runOpeningAnimation = () => {
        if (!this.notification) {
            return;
        }
        const {openDuration, animationMethod, onOpen, animationOptions} = this.notification;
        Animated[animationMethod](this.animation, {
            ...animationOptions,
            toValue: 1,
            duration: openDuration,
            useNativeDriver: false,
        }).start(({finished}) => {
            if (finished) {
                onOpen && onOpen();
                this.startCloseTimeout();
            }
        });
    };

    /**
     * Close notification
     *
     * @param swipeClosingType
     */
    public close = (swipeClosingType?: SwipeTypes) => {
        if (!this.isVisible) {
            return;
        }

        this.timeout && clearTimeout(this.timeout);

        this.setState({
            closing: true,
            swipeClosingType: swipeClosingType || null,
        }, () => {
            this.animation.stopAnimation(() => {
                const {closeDuration, onClose, nextNotificationInterval} = this.notification || this.props;
                Animated.timing(this.animation, {
                    toValue: 0,
                    duration: closeDuration,
                    useNativeDriver: false,
                }).start(({finished}) => {
                    if (finished) {
                        this.setState({
                            visible: false,
                            swipeClosingType: null,
                        }, () => {
                            if (this.notification) {
                                onClose && onClose();
                                setTimeout(() => {
                                    this.isVisible = false;
                                    this.showNextNotification();
                                }, nextNotificationInterval);
                            }
                            this.notification = undefined;
                        });
                    }
                });
            });
        });
    };

    /**
     * Close all notifications
     */
    public closeAll = () => {
        this.notifications = [];
        if (this.isVisible) {
            this.close();
        }
    };

    /**
     * Start auto-closing timeout
     */
    protected startCloseTimeout = (): void => {
        if (this.notification && !this.lockClosing) {
            const {autoCloseTimeout} = this.notification;
            if (autoCloseTimeout > 0) {
                this.timeout && clearTimeout(this.timeout);
                this.timeout = setTimeout(() => {
                    this.close();
                }, autoCloseTimeout);
            }
        }
    };

    /**
     *
     * @param nextProps
     * @param nextState
     */
    shouldComponentUpdate(nextProps: Readonly<NotificationContainerProps>, nextState: Readonly<NotificationContainerState>): boolean {
        const {propsAreEqual} = this.props;
        const {visible, height, closing, swipeClosingType} = this.state;
        return !(
            visible === nextState.visible
            && height === nextState.height
            && closing === nextState.closing
            && swipeClosingType === nextState.swipeClosingType
            && (propsAreEqual ? propsAreEqual(this.props, nextProps) : true)
        );
    }

    /**
     * Mount
     */
    componentDidMount(): void {
        this.mount = true;
    }

    /**
     * Unmount
     */
    componentWillUnmount(): void {
        this.timeout && clearTimeout(this.timeout);
        this.animation.stopAnimation();
        this.translateX.stopAnimation();
        this.translateY.stopAnimation();
        this.mount = false;
    }

    /**
     * Render component
     */
    render() {
        const {visible, closing, height} = this.state;

        if (!visible || !this.notification) {
            return null;
        }

        const {render} = this.notification;

        const animationStyles = this.getAnimationStyles();

        return (
            <Animated.View
                style={[
                    styles.animatedView,
                    animationStyles,
                    {
                        transform: [
                            {translateX: this.translateX},
                            {translateY: this.translateY},
                            {scale: this.scale},
                        ],
                    },
                ]}
            >
                <View
                    pointerEvents={closing ? 'none' : 'auto'}
                    style={styles.contentView}
                    {...this.panResponder.panHandlers}
                    onLayout={({nativeEvent: {layout: {height: layoutHeight}}}) => {
                        if (this.allowUpdateHeight) {
                            this.allowUpdateHeight = false;
                            const roundedHeight = Math.round(layoutHeight);
                            if (roundedHeight !== height) {
                                this.setState({
                                    height: roundedHeight,
                                }, this.runOpeningAnimation);
                            } else {
                                this.runOpeningAnimation();
                            }
                        }
                    }}
                >
                    {render()}
                </View>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    animatedView: {
        position: 'absolute',
        width: '100%',
        top: 0,
        zIndex: 999,
        elevation: 999,
    },
    contentView: {
        width: '100%',
    },
});
