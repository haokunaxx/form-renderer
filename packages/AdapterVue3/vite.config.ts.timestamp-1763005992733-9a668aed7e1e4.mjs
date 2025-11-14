// vite.config.ts
import { defineConfig } from "file:///Users/xuxin/projects/form-renderer/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.23/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/xuxin/projects/form-renderer/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vite@5.4.21_@types+node@20.19.23__vue@3.5.22_typescript@5.9.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import dts from "file:///Users/xuxin/projects/form-renderer/node_modules/.pnpm/vite-plugin-dts@4.5.4_@types+node@20.19.23_rollup@4.52.5_typescript@5.9.3_vite@5.4.21_@types+node@20.19.23_/node_modules/vite-plugin-dts/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/Users/xuxin/projects/form-renderer/packages/AdapterVue3";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    dts({
      include: ["src/**/*"],
      exclude: ["src/**/*.test.ts", "tests/**/*"],
      outDir: "dist",
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: true,
      // 打包类型为单文件
      copyDtsFiles: true,
      skipDiagnostics: true,
      // 跳过类型诊断
      logDiagnostics: false,
      aliasesExclude: ["@form-renderer/engine"]
      // 排除外部依赖别名
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      name: "FormAdapter",
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`
    },
    rollupOptions: {
      external: ["vue", "@form-renderer/engine"],
      output: {
        globals: {
          vue: "Vue",
          "@form-renderer/engine": "FormEngine"
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") {
            return "style.css";
          }
          return assetInfo.name;
        }
      }
    },
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
    target: "es2020"
  },
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData.ts"
      ]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMveHV4aW4vcHJvamVjdHMvZm9ybS1yZW5kZXJlci9wYWNrYWdlcy9BZGFwdGVyVnVlM1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3h1eGluL3Byb2plY3RzL2Zvcm0tcmVuZGVyZXIvcGFja2FnZXMvQWRhcHRlclZ1ZTMvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3h1eGluL3Byb2plY3RzL2Zvcm0tcmVuZGVyZXIvcGFja2FnZXMvQWRhcHRlclZ1ZTMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cydcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgZHRzKHtcbiAgICAgIGluY2x1ZGU6IFsnc3JjLyoqLyonXSxcbiAgICAgIGV4Y2x1ZGU6IFsnc3JjLyoqLyoudGVzdC50cycsICd0ZXN0cy8qKi8qJ10sXG4gICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgIHN0YXRpY0ltcG9ydDogdHJ1ZSxcbiAgICAgIGluc2VydFR5cGVzRW50cnk6IHRydWUsXG4gICAgICByb2xsdXBUeXBlczogdHJ1ZSwgLy8gXHU2MjUzXHU1MzA1XHU3QzdCXHU1NzhCXHU0RTNBXHU1MzU1XHU2NTg3XHU0RUY2XG4gICAgICBjb3B5RHRzRmlsZXM6IHRydWUsXG4gICAgICBza2lwRGlhZ25vc3RpY3M6IHRydWUsIC8vIFx1OERGM1x1OEZDN1x1N0M3Qlx1NTc4Qlx1OEJDQVx1NjVBRFxuICAgICAgbG9nRGlhZ25vc3RpY3M6IGZhbHNlLFxuICAgICAgYWxpYXNlc0V4Y2x1ZGU6IFsnQGZvcm0tcmVuZGVyZXIvZW5naW5lJ10gLy8gXHU2MzkyXHU5NjY0XHU1OTE2XHU5MEU4XHU0RjlEXHU4RDU2XHU1MjJCXHU1NDBEXG4gICAgfSlcbiAgXSxcblxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpXG4gICAgfVxuICB9LFxuXG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaW5kZXgudHMnKSxcbiAgICAgIG5hbWU6ICdGb3JtQWRhcHRlcicsXG4gICAgICBmaWxlTmFtZTogKGZvcm1hdCkgPT4gYGluZGV4LiR7Zm9ybWF0ID09PSAnZXMnID8gJ2pzJyA6ICdjanMnfWBcbiAgICB9LFxuXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFsndnVlJywgJ0Bmb3JtLXJlbmRlcmVyL2VuZ2luZSddLFxuXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgIHZ1ZTogJ1Z1ZScsXG4gICAgICAgICAgJ0Bmb3JtLXJlbmRlcmVyL2VuZ2luZSc6ICdGb3JtRW5naW5lJ1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgaWYgKGFzc2V0SW5mby5uYW1lID09PSAnc3R5bGUuY3NzJykge1xuICAgICAgICAgICAgcmV0dXJuICdzdHlsZS5jc3MnXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBhc3NldEluZm8ubmFtZSFcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgIHRhcmdldDogJ2VzMjAyMCdcbiAgfSxcblxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBjb3ZlcmFnZToge1xuICAgICAgcHJvdmlkZXI6ICd2OCcsXG4gICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24nLCAnaHRtbCddLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAnbm9kZV9tb2R1bGVzLycsXG4gICAgICAgICd0ZXN0cy8nLFxuICAgICAgICAnKiovKi5kLnRzJyxcbiAgICAgICAgJyoqLyouY29uZmlnLionLFxuICAgICAgICAnKiovbW9ja0RhdGEudHMnXG4gICAgICBdXG4gICAgfVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwVixTQUFTLG9CQUFvQjtBQUN2WCxPQUFPLFNBQVM7QUFDaEIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixJQUFJO0FBQUEsTUFDRixTQUFTLENBQUMsVUFBVTtBQUFBLE1BQ3BCLFNBQVMsQ0FBQyxvQkFBb0IsWUFBWTtBQUFBLE1BQzFDLFFBQVE7QUFBQSxNQUNSLGNBQWM7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLGFBQWE7QUFBQTtBQUFBLE1BQ2IsY0FBYztBQUFBLE1BQ2QsaUJBQWlCO0FBQUE7QUFBQSxNQUNqQixnQkFBZ0I7QUFBQSxNQUNoQixnQkFBZ0IsQ0FBQyx1QkFBdUI7QUFBQTtBQUFBLElBQzFDLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ2pDO0FBQUEsRUFDRjtBQUFBLEVBRUEsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxNQUN4QyxNQUFNO0FBQUEsTUFDTixVQUFVLENBQUMsV0FBVyxTQUFTLFdBQVcsT0FBTyxPQUFPLEtBQUs7QUFBQSxJQUMvRDtBQUFBLElBRUEsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDLE9BQU8sdUJBQXVCO0FBQUEsTUFFekMsUUFBUTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1AsS0FBSztBQUFBLFVBQ0wseUJBQXlCO0FBQUEsUUFDM0I7QUFBQSxRQUVBLGdCQUFnQixDQUFDLGNBQWM7QUFDN0IsY0FBSSxVQUFVLFNBQVMsYUFBYTtBQUNsQyxtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTyxVQUFVO0FBQUEsUUFDbkI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBRUEsYUFBYTtBQUFBLElBQ2IsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUVBLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ2pDLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
