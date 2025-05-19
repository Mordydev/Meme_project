import { InputHandler } from './InputHandler';
import { PlayerController } from '../managers/PlayerController';
import { configSystem } from './ConfigurationSystem';

describe('InputHandler - processSwipe', () => {
  let inputHandler: InputHandler;
  let mockPlayerController: jest.Mocked<PlayerController>;
  let mockCanvas: HTMLElement;

  const mockTouchConfig = {
    swipeMinDistance: 40,
    swipeMaxDuration: 500,
    swipeAngleThreshold: Math.PI / 5,
  };

  beforeEach(() => {
    jest.spyOn(configSystem, 'get').mockImplementation((key: any) => {
      if (key === 'touchControls') {
        return mockTouchConfig as any;
      }
      return {} as any;
    });

    mockPlayerController = {
      moveLeft: jest.fn(),
      moveRight: jest.fn(),
      jump: jest.fn(),
      dive: jest.fn(),
    } as any;

    mockCanvas = document.createElement('div');
    inputHandler = new InputHandler(mockPlayerController);
    (inputHandler as any).touchConfig = mockTouchConfig;
  });

  const testSwipe = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number
  ) => {
    (inputHandler as any).processSwipe(startX, startY, endX, endY, duration);
  };

  it('detects upward swipe', () => {
    testSwipe(100, 200, 105, 100, 100);
    expect(mockPlayerController.jump).toHaveBeenCalled();
  });

  it('detects downward swipe', () => {
    testSwipe(100, 100, 95, 200, 100);
    expect(mockPlayerController.dive).toHaveBeenCalled();
  });

  it('detects left swipe', () => {
    testSwipe(200, 100, 100, 105, 100);
    expect(mockPlayerController.moveLeft).toHaveBeenCalled();
  });

  it('detects right swipe', () => {
    testSwipe(100, 100, 200, 95, 100);
    expect(mockPlayerController.moveRight).toHaveBeenCalled();
  });

  it('ignores short swipes', () => {
    testSwipe(100, 100, 100, 100 + mockTouchConfig.swipeMinDistance - 1, 100);
    expect(mockPlayerController.dive).not.toHaveBeenCalled();
  });

  it('ignores long-duration swipes', () => {
    testSwipe(
      100,
      100,
      100,
      100 + mockTouchConfig.swipeMinDistance + 10,
      mockTouchConfig.swipeMaxDuration + 1
    );
    expect(mockPlayerController.dive).not.toHaveBeenCalled();
  });

  it('interprets slight diagonal up as jump', () => {
    testSwipe(
      100,
      200,
      100 + mockTouchConfig.swipeMinDistance * 0.3,
      100,
      100
    );
    expect(mockPlayerController.jump).toHaveBeenCalled();
    expect(mockPlayerController.moveRight).not.toHaveBeenCalled();
  });

  it('interprets slight diagonal right as right', () => {
    testSwipe(
      100,
      100,
      200,
      100 - mockTouchConfig.swipeMinDistance * 0.3,
      100
    );
    expect(mockPlayerController.moveRight).toHaveBeenCalled();
    expect(mockPlayerController.jump).not.toHaveBeenCalled();
  });

  it('ignores ambiguous diagonal', () => {
    testSwipe(
      100,
      100,
      100 + mockTouchConfig.swipeMinDistance,
      100 + mockTouchConfig.swipeMinDistance,
      100
    );
    expect(mockPlayerController.jump).not.toHaveBeenCalled();
    expect(mockPlayerController.dive).not.toHaveBeenCalled();
    expect(mockPlayerController.moveLeft).not.toHaveBeenCalled();
    expect(mockPlayerController.moveRight).not.toHaveBeenCalled();
  });
});
