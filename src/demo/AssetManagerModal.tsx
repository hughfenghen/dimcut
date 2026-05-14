import { type Component, For, Show } from "solid-js";
import { useI18n } from "../i18n";
import type { AsrData, IChangeEventData } from "../lib/types.ts";
import { formatTime } from "../lib/time-utils.ts";
import { ITEM_COLORS } from "../lib/constants.ts";

interface AssetManagerModalProps {
  data: IChangeEventData;
  mainTrackDeleted: boolean;
  asrDeleted: boolean;
  onReplaceMainTrack: (file: File) => void;
  onDeleteMainTrack: () => void;
  onDeleteAsr: () => void;
  onImportAsr: (data: AsrData) => void;
  onDeleteItem: (id: string) => void;
  onImportItems: (files: File[]) => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  video: "Video",
  audio: "Audio",
  image: "Image",
  text: "Text",
};

export const AssetManagerModal: Component<AssetManagerModalProps> = (props) => {
  let mainTrackFileInput: HTMLInputElement | undefined;
  let asrFileInput: HTMLInputElement | undefined;
  let importFileInput: HTMLInputElement | undefined;

  const { t } = useI18n();

  const handleReplaceMainTrack = () => mainTrackFileInput?.click();
  const handleImportAsr = () => asrFileInput?.click();
  const handleImportItems = () => importFileInput?.click();

  const onMainTrackFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      props.onReplaceMainTrack(file);
      input.value = "";
    }
  };

  const onAsrFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      try {
        const asrData: AsrData = JSON.parse(await file.text());
        asrData.filename = file.name;
        props.onImportAsr(asrData);
      } catch {
        alert(t("demoModal.invalidAsr"));
      }
      input.value = "";
    }
  };

  const onImportFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      props.onImportItems(Array.from(files));
      input.value = "";
    }
  };

  const asrExists = () =>
    !props.asrDeleted && props.data.mainTrackConf.asrData;

  return (
    <div
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div class="bg-white rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-800">
            {t("demoModal.title")}
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 text-lg leading-none"
            onClick={props.onClose}
          >
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-600 mb-2">
              {t("demoModal.mainTrack")}
            </h3>
            <div class="space-y-1.5">
              <Show
                when={!props.mainTrackDeleted}
                fallback={
                  <div class="rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">
                        {t("demoModal.mainTrackBadge")}
                      </span>
                      <span class="text-sm text-gray-400">
                        {t("demoModal.mainTrackRemoved")}
                      </span>
                    </div>
                    <button
                      class="text-xs px-2 py-1 bg-black text-white rounded hover:bg-gray-800"
                      onClick={handleReplaceMainTrack}
                    >
                      {t("demoModal.replaceTrack")}
                    </button>
                  </div>
                }
              >
                <div class="rounded border border-gray-200 px-3 py-2.5 flex items-center justify-between hover:bg-gray-50">
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="text-xs px-1.5 py-0.5 rounded flex-shrink-0 text-gray-700"
                      style={{
                        "background-color":
                          ITEM_COLORS[props.data.mainTrackConf.item.type],
                      }}
                    >
                      {TYPE_LABELS[props.data.mainTrackConf.item.type] ?? "Video"}
                    </span>
                    <span class="text-sm text-gray-800 truncate">
                      {props.data.mainTrackConf.item.file.name}
                    </span>
                    <span class="text-xs text-gray-400 flex-shrink-0">
                      {formatTime(
                        props.data.mainTrackConf.item.endTime -
                          props.data.mainTrackConf.item.startTime,
                      )}
                    </span>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button
                      class="text-xs px-2 py-1 text-gray-500 hover:text-black rounded hover:bg-gray-100"
                      onClick={handleReplaceMainTrack}
                    >
                      {t("demoModal.replaceAsset")}
                    </button>
                    <button
                      class="text-xs px-2 py-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
                      onClick={props.onDeleteMainTrack}
                    >
                      {t("demoModal.delete")}
                    </button>
                  </div>
                </div>
              </Show>

              <Show
                when={asrExists()}
                fallback={
                  <Show when={props.asrDeleted}>
                    <div class="rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span
                          class="text-xs px-1.5 py-0.5 rounded text-gray-700"
                          style={{ "background-color": ITEM_COLORS.asr }}
                        >
                          ASR
                        </span>
                        <span class="text-sm text-gray-400">
                          {t("demoModal.asrRemoved")}
                        </span>
                      </div>
                      <button
                        class="text-xs px-2 py-1 bg-black text-white rounded hover:bg-gray-800"
                        onClick={handleImportAsr}
                      >
                        {t("demoModal.importAsr")}
                      </button>
                    </div>
                  </Show>
                }
              >
                <div class="rounded border border-gray-200 px-3 py-2.5 flex items-center justify-between hover:bg-gray-50">
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="text-xs px-1.5 py-0.5 rounded text-gray-700"
                      style={{ "background-color": ITEM_COLORS.asr }}
                    >
                      ASR
                    </span>
                    <span class="text-sm text-gray-800 truncate">
                      {props.data.mainTrackConf.asrData!.filename ?? "ASR"}
                    </span>
                    <span class="text-xs text-gray-400 flex-shrink-0">
                      {(() => {
                        const segs = props.data.mainTrackConf.asrData!.segments;
                        const lastEnd =
                          segs.length > 0 ? segs[segs.length - 1].end : 0;
                        return formatTime(lastEnd);
                      })()}
                    </span>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button
                      class="text-xs px-2 py-1 text-gray-500 hover:text-black rounded hover:bg-gray-100"
                      onClick={handleImportAsr}
                    >
                      {t("demoModal.replaceAsset")}
                    </button>
                    <button
                      class="text-xs px-2 py-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
                      onClick={props.onDeleteAsr}
                    >
                      {t("demoModal.delete")}
                    </button>
                  </div>
                </div>
              </Show>
            </div>
            <p class="text-xs text-gray-400 mt-2">
              {t("demoModal.asrSchemaTipPrefix")}
              <a
                href="/chunjianghuayueye_asr.json"
                target="_blank"
                rel="noreferrer"
                class="text-blue-500 underline hover:text-blue-700"
              >
                {t("demoModal.asrSchemaTipLink")}
              </a>
              {t("demoModal.asrSchemaTipSuffix")}
            </p>
          </div>

          <div>
            <h3 class="text-sm font-medium text-gray-600 mb-2">
              {t("demoModal.overlayAssets")}
            </h3>
            <Show
              when={props.data.items.length > 0}
              fallback={
                <div class="text-xs text-gray-400 py-3 text-center">
                  {t("demoModal.noOverlay")}
                </div>
              }
            >
              <div class="space-y-1.5">
                <For each={props.data.items}>
                  {(item) => (
                    <div class="rounded border border-gray-200 px-3 py-2 flex items-center justify-between hover:bg-gray-50">
                      <div class="flex items-center gap-2 min-w-0">
                        <span
                          class="text-xs px-1.5 py-0.5 rounded flex-shrink-0 text-gray-700"
                          style={{
                            "background-color":
                              ITEM_COLORS[item.type] ?? "#E5E7EB",
                          }}
                        >
                          {TYPE_LABELS[item.type] ?? "Video"}
                        </span>
                        <span class="text-sm text-gray-800 truncate">
                          {"file" in item
                            ? (item as { file: File }).file.name
                            : item.id}
                        </span>
                        <span class="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(item.endTime - item.startTime)}
                        </span>
                      </div>
                      <button
                        class="text-xs px-2 py-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 flex-shrink-0"
                        onClick={() => props.onDeleteItem(item.id)}
                      >
                        {t("demoModal.delete")}
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>

        <div class="px-4 py-3 border-t border-gray-200">
          <button
            class="w-full px-3 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
            onClick={handleImportItems}
          >
            {t("demoModal.importAsset")}
          </button>
        </div>

        <input
          ref={mainTrackFileInput}
          type="file"
          accept="video/*,audio/*"
          class="hidden"
          onChange={onMainTrackFileChange}
        />
        <input
          ref={asrFileInput}
          type="file"
          accept=".json"
          class="hidden"
          onChange={onAsrFileChange}
        />
        <input
          ref={importFileInput}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          class="hidden"
          onChange={onImportFileChange}
        />
      </div>
    </div>
  );
};
