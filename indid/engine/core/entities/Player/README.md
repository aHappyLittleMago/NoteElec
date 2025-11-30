# Player 实体类说明
`Player` 是自定义游戏引擎的核心玩家实体类，专门用于创建和管理游戏场景中的玩家实体对象。它把玩家的基础信息、渲染样式、业务属性进行分层管理，还自带严格的类型校验和便捷的属性操作方法，能直接适配引擎的渲染模块规范。开发者不用再手动处理实体属性的校验和渲染适配问题，只需简单调用方法就能快速创建符合要求的玩家实体。

## 核心功能
1. **属性分层规范管理**
    - **基础核心属性**：包含实体唯一ID、坐标位置、尺寸大小，是玩家实体的必备信息，每个属性都有合理的默认值（比如默认坐标`[0,0]`、默认尺寸`[1,1]`）；
    - **渲染扩展属性**：包含背景色、透明度、旋转角度、边框样式、渲染形状、图片路径等，专门适配引擎的渲染模块，设置后可直接用于实体渲染；
    - **业务扩展属性**：包含实体名称，可根据游戏需求扩展等级、血量、攻击力等自定义属性。

2. **严格的属性类型校验**
    - 创建实体时，传入的自定义属性会自动经过校验，比如坐标必须是`[数字, 数字]`、透明度必须在0-1之间、渲染形状只能是矩形（`rect`）或圆形（`circle`）；
    - 校验失败时会抛出格式化的错误信息，比如“location属性类型错误：期望是数字数组[x,y]”，方便开发者快速定位问题。

3. **便捷的属性操作方法**
    - **位置操作**：提供`getX/setX`、`getY/setY`、`setLocation`等方法，支持单独修改X/Y坐标，也能通过数组一次性设置位置，避免直接修改数组导致的错误；
    - **尺寸操作**：提供`getW/setW`、`getH/setH`、`setSize`等方法，轻松调整实体的宽和高，方法支持数字参数或数组参数两种形式；
    - **渲染属性操作**：提供`setOpacity`、`setRotation`、`setBorder`等快捷方法，专门处理渲染相关属性，比如设置透明度时会自动校验0-1的范围。

4. **灵活的动态扩展能力**
    - 除了类中定义的属性，还能给玩家实体动态添加任意自定义属性，比如`level`（等级）、`hp`（血量）、`speed`（移动速度）等；
    - 自定义属性无需提前声明，创建实例时直接传入即可，满足不同游戏的业务需求。

5. **渲染属性适配优化**
    - 内置渲染模块所需的所有关键属性，比如渲染形状、图片路径、边框样式，设置后可直接被渲染模块读取；
    - 图片路径（`imageSrc`）的优先级高于背景色（`background`），设置了图片路径的实体，渲染时会优先显示图片，无需额外写判断逻辑。

## 核心实现概述
1. **属性分层设计**
    - 类中通过不同的属性声明，将基础核心属性（`id`、`location`、`size`）、渲染扩展属性（`background`、`opacity`、`shape`等）、业务扩展属性（`name`）分开定义，并为每个属性设置默认值；
    - 使用 TypeScript 的索引签名`[key: string]: any`实现动态扩展能力，允许给实例添加任意自定义属性。

2. **类型校验机制**
    - 构造函数中定义`validators`校验规则对象，每个关键属性对应一个校验函数，比如`location`的校验函数会检查是否是长度为2的数字数组；
    - 调用`getValidationErrorMsg`方法生成格式化的错误提示，该方法通过`errorMap`映射属性名和对应的错误信息，确保提示清晰易懂；
    - 先校验并初始化关键属性，再处理自定义扩展属性，保证核心属性的合法性。

3. **方法体系封装**
    - **位置/尺寸方法**：采用方法重载的设计，`setLocation`和`setSize`既支持传入两个数字参数，也支持传入数组参数，适配不同的开发习惯；
    - **渲染属性方法**：每个方法都包含参数校验，比如`setOpacity`会检查参数是否是0-1的数字，避免非法值导致渲染异常；
    - **取值方法**：`getLocation`、`getSize`等方法返回属性的拷贝而非原数组，防止外部直接修改数组破坏实体内部状态。

4. **渲染适配处理**
    - 预设`imageSrc`优先于`background`的渲染逻辑（由渲染模块实现），类中仅通过属性定义明确优先级；
    - 渲染形状限制为`rect`和`circle`两种，与渲染模块的形状渲染能力匹配，避免设置不支持的形状导致渲染失败。

## 基础使用示例
### 1. 类的导入
在游戏代码中通过 ES6 模块语法导入`Player`类：
```typescript
import { Player } from "./path/to/player";
```

### 2. 创建玩家实体
#### 2.1 创建默认玩家实体
不传入任何参数时，实体会使用所有属性的默认值：
```typescript
// 创建默认玩家，属性均为默认值
const defaultPlayer = new Player();

console.log(defaultPlayer.id); // 输出：-1（默认唯一标识）
console.log(defaultPlayer.location); // 输出：[0, 0]（默认坐标）
console.log(defaultPlayer.shape); // 输出：rect（默认渲染形状为矩形）
```

#### 2.2 创建自定义属性的玩家实体
传入自定义属性对象，合法的属性会覆盖默认值，还能添加动态扩展属性：
```typescript
// 创建带自定义属性的玩家实体
const heroPlayer = new Player({
  id: "player_001", // 自定义唯一ID
  name: "勇者", // 自定义实体名称
  location: [100, 200], // 自定义坐标
  size: [50, 80], // 自定义宽高
  background: "#ff4400", // 自定义背景色
  opacity: 0.9, // 自定义透明度
  shape: "circle", // 渲染形状改为圆形
  border: { width: 2, color: "#ffffff" }, // 自定义边框
  imageSrc: "/images/hero.png", // 自定义玩家图片路径
  // 动态扩展业务属性，无需提前声明
  level: 1, // 玩家等级
  hp: 100, // 玩家血量
  speed: 5 // 玩家移动速度
});

// 访问属性
console.log(heroPlayer.name); // 输出：勇者
console.log(heroPlayer.level); // 输出：1（动态扩展属性）
console.log(heroPlayer.getLocation()); // 输出：[100, 200]（获取坐标）
```

### 3. 玩家属性操作
#### 3.1 位置操作
通过封装的方法修改和获取玩家坐标，避免直接操作数组：
```typescript
const player = new Player({ location: [50, 50] });

// 单独设置X坐标
player.setX(150);
console.log(player.getX()); // 输出：150

// 单独设置Y坐标
player.setY(250);
console.log(player.getY()); // 输出：250

// 一次性设置位置（数组形式）
player.setLocation([200, 300]);
console.log(player.getLocation()); // 输出：[200, 300]

// 一次性设置位置（数字参数形式）
player.setLocation(250, 350);
console.log(player.getLocation()); // 输出：[250, 350]
```

#### 3.2 尺寸操作
通过方法修改和获取玩家的宽高：
```typescript
const player = new Player({ size: [20, 30] });

// 单独设置宽度
player.setW(60);
console.log(player.getW()); // 输出：60

// 单独设置高度
player.setH(90);
console.log(player.getH()); // 输出：90

// 一次性设置尺寸（数组形式）
player.setSize([80, 120]);
console.log(player.getSize()); // 输出：[80, 120]

// 一次性设置尺寸（数字参数形式）
player.setSize(100, 150);
console.log(player.getSize()); // 输出：[100, 150]
```

#### 3.3 渲染属性操作
通过快捷方法配置渲染相关属性，方法会自动校验参数合法性：
```typescript
const player = new Player();

// 设置透明度（0-1之间）
player.setOpacity(0.7);
console.log(player.opacity); // 输出：0.7

// 设置旋转角度（弧度，比如π/2对应90度）
player.setRotation(Math.PI / 2);
console.log(player.rotation); // 输出：1.5707963267948966

// 设置边框（宽度2px，白色）
player.setBorder(2, "#ffffff");
console.log(player.border); // 输出：{ width: 2, color: '#ffffff' }

// 设置渲染形状为圆形
player.setShape("circle");
console.log(player.shape); // 输出：circle

// 设置玩家图片路径
player.setImageSrc("/images/player.png");
console.log(player.imageSrc); // 输出：/images/player.png
```

### 4. 异常处理
传入非法属性或调用方法时传入错误参数，会抛出类型错误，建议通过`try/catch`捕获并处理：
```typescript
// 场景1：创建实体时传入非法属性
try {
  // 错误：location传入字符串而非数字数组
  const errorPlayer = new Player({ location: "100,200" });
} catch (e) {
  console.error(e.message); // 输出：Invalid type for location: expected number[] [x, y]
}

// 场景2：调用方法时传入非法参数
try {
  const player = new Player();
  // 错误：透明度传入大于1的数字
  player.setOpacity(1.5);
} catch (e) {
  console.error(e.message); // 输出：opacity must be a number between 0 and 1
}
```

## 注意事项
1. **渲染属性的优先级**
    - 当同时设置`imageSrc`（图片路径）和`background`（背景色）时，渲染模块会优先显示图片，背景色会被覆盖，若图片加载失败才会显示背景色。

2. **属性修改的正确方式**
    - 位置（`location`）和尺寸（`size`）是数组类型，建议通过类提供的`setLocation`、`setSize`、`setX`等方法修改，不要直接通过`player.location[0] = 100`的方式修改，避免绕过类型校验。

3. **取值方法的返回值**
    - `getLocation`、`getSize`方法返回的是属性的拷贝数组，而非原数组，修改返回的数组不会影响实体的内部状态，比如`const loc = player.getLocation(); loc[0] = 200`不会改变玩家的实际坐标。

4. **动态扩展属性的使用**
    - 可以给实体添加任意自定义属性，但建议使用有语义的属性名，避免和类中已定义的属性名重复（如`id`、`name`），防止覆盖核心属性。

5. **异常捕获的必要性**
    - 创建实体或调用方法时，若传入非法参数会抛出错误，在开发环境中建议添加`try/catch`捕获错误，避免游戏直接崩溃，还能通过错误信息快速定位问题。