import axios from "axios";
import * as vscode from "vscode";

interface QpOption {
  id: string;
  label: string;
}

type Replacement = {
  [key: string]: string;
};

interface VarLib {
  id: number;
  name: string;
  variables: {
    [key: string]: {
      value: string;
      isSecret: boolean;
      allowOverride: boolean;
    };
  };
}

export async function activate(context: vscode.ExtensionContext) {
  console.log('"azdo-libvar-search-replace" is active.');

  let variableLibraries: VarLib[];
  let qpOptions: QpOption[];

  const getVarLibs = async () => {
    const config = vscode.workspace.getConfiguration(
      "azdo-libvar-search-replace"
    );
    const url = `https://dev.azure.com/${config.org}/${config.project}/_apis/distributedtask/variablegroups?api-version=7.0`;
    const token = Buffer.from(`nobody:${config.pat}`, "utf8").toString(
      "base64"
    );

    const data = await axios.get(url, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Authorization: `Basic ${token}` },
    });

    variableLibraries = data.data.value;
    qpOptions = variableLibraries.map((item) => ({
      id: String(item.id),
      label: item.name,
    }));
  };

  const replaceFileContents = (newContent: string) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No active text editor found!");
      return;
    }

    const fullRange = new vscode.Range(
      editor.document.positionAt(0),
      editor.document.positionAt(editor.document.getText().length)
    );

    editor.edit((editBuilder) => {
      editBuilder.replace(fullRange, newContent);
    });
  };

  let disposable = vscode.commands.registerCommand(
    "azdo-libvar-search-replace.searchAndReplace",
    async () => {
      await getVarLibs();

      const selectedItem = await vscode.window.showQuickPick(qpOptions, {
        placeHolder: "Select a variable library",
      });

      if (!selectedItem) {
        vscode.window.showInformationMessage("No item selected");
        return;
      }

      const vars = variableLibraries.find(
        (o) => o.id === Number(selectedItem.id)
      )?.variables;
      const replacements: Replacement = {};

      Object.keys(vars!).forEach((key) => {
        replacements[key] = vars![key].value;
      });

      const docText = vscode.window.activeTextEditor?.document.getText();
      const result = docText?.replace(
        /#\{(.*?)\}#/g,
        (match, key) => replacements[key] || match
      );

      if (result) {
        replaceFileContents(result);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
