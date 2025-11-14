import { createContext, useContext } from 'react';

// 1. 创建 Context（可以指定默认值，这里默认值为 null）
export const MyContext = createContext(null);