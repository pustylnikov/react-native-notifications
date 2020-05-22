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
    onClose?: () => void
    onOpen?: () => void
    onPress?: () => void
    priority?: number
    autoCloseTimeout?: number
    openAnimationTypes?: AnimationTypes[]
    closeAnimationTypes?: AnimationTypes[]
    allowCloseSwipeTypes?: SwipeTypes[]
    renderProps?: AnyObject
    animationMethod?: AnimationMethods
    animationOptions?: AnimationConfig
    enableOnPressAnimation?: boolean
}

type PreparedNotification = {
    onClose: (() => void) | null
    onOpen: (() => void) | null
    onPress: (() => void) | null
    priority: number
    autoCloseTimeout: number
    openAnimationTypes: AnimationTypes[]
    closeAnimationTypes: AnimationTypes[]
    allowCloseSwipeTypes: SwipeTypes[]
    animationMethod: AnimationMethods
    renderProps: AnyObject | undefined
    animationOptions: AnimationConfig
    enableOnPressAnimation: boolean
}

export type NotificationContainerProps = {
    render: (renderProps?: AnyObject) => ReactNode
    showDuration: number
    hideDuration: number
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
    onClose?: (renderProps?: AnyObject) => void
    onOpen?: (renderProps?: AnyObject) => void
    onPress?: (renderProps?: AnyObject) => void
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
        showDuration: 300,
        hideDuration: 300,
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
     *
     * @type {null}
     * @private
     */
    protected notification: PreparedNotification | undefined;

    /**
     *
     * @type {boolean}
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
            return !!(this.notification && (this.props.onPress || this.notification.onPress));
        },
        onMoveShouldSetPanResponder: () => {
            return !!(this.notification && this.notification.allowCloseSwipeTypes.length);
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
            const {onPress: onPressProp, closeSwipeVelocity, closeSwipeDistance} = this.props;
            const {onPress: onPressNotify, allowCloseSwipeTypes, renderProps, enableOnPressAnimation} = this.notification;

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
                        onPressProp && onPressProp(renderProps);
                        onPressNotify && onPressNotify();
                        setTimeout(() => {
                            this.close();
                        });
                    });
                } else {
                    onPressProp && onPressProp(renderProps);
                    onPressNotify && onPressNotify();
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
            renderProps: undefined,
            onClose: null,
            onOpen: null,
            onPress: null,
            priority: 0,
            animationOptions: this.props.animationOptions,
            autoCloseTimeout: this.props.autoCloseTimeout,
            openAnimationTypes: this.props.openAnimationTypes,
            closeAnimationTypes: this.props.closeAnimationTypes,
            allowCloseSwipeTypes: this.props.allowCloseSwipeTypes,
            animationMethod: this.props.animationMethod,
            enableOnPressAnimation: this.props.enableOnPressAnimation,
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
        this.notification = this.notifications.shift();

        if (!this.notification) {
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
        const {showDuration, onOpen} = this.props;
        const {animationMethod, renderProps, onOpen: onOpenNotify, animationOptions} = this.notification;
        Animated[animationMethod](this.animation, {
            ...animationOptions,
            toValue: 1,
            duration: showDuration,
            useNativeDriver: false,
        }).start(({finished}) => {
            if (finished) {
                onOpen && onOpen(renderProps);
                onOpenNotify && onOpenNotify();
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
                const {hideDuration, onClose, nextNotificationInterval} = this.props;
                Animated.timing(this.animation, {
                    toValue: 0,
                    duration: hideDuration,
                    useNativeDriver: false,
                }).start(({finished}) => {
                    if (finished) {
                        this.setState({
                            visible: false,
                            swipeClosingType: null,
                        }, () => {
                            if (this.notification) {
                                onClose && onClose(this.notification.renderProps);
                                this.notification.onClose && this.notification.onClose();
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
     * Mount
     */
    componentDidMount() {
        this.mount = true;
    }

    /**
     * Unmount
     */
    componentWillUnmount() {
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

        const {render} = this.props;
        const {renderProps} = this.notification;

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
                    {render(renderProps)}
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
