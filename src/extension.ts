// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "azdo-libvar-search-replace" is now active!'
  );

  let variableLibraries: VarLib[];
  let qpOptions: QpOption[];

  const getVarLibs = async () => {
    let config = vscode.workspace.getConfiguration(
      "azdo-libvar-search-replace"
    );
    const url = `https://dev.azure.com/${config.org}/${config.project}/_apis/distributedtask/variablegroups?api-version=7.0`;
    const token = Buffer.from(`nobody:${config.pat}`, "utf8").toString(
      "base64"
    );
    console.log("getting the data");
    let data = await axios.get(url, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Authorization: `Basic ${token}` },
    });

    console.log("storing the data");
    variableLibraries = data.data.value;
    console.log("mappping the data");
    qpOptions = variableLibraries.map((item) => ({
      id: String(item.id),
      label: item.name,
    }));
    console.log("done");
  };

  const replaceFileContents = (newContent: string) => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
      );

      editor.edit((editBuilder) => {
        editBuilder.replace(fullRange, newContent);
      });
    } else {
      vscode.window.showWarningMessage("No active text editor found!");
    }
  };

  let disposable = vscode.commands.registerCommand(
    "azdo-libvar-search-replace.searchAndReplace",
    async () => {
      await getVarLibs();

      const selectedItem = await vscode.window.showQuickPick(qpOptions, {
        placeHolder: "Select a variable library",
      });

      if (selectedItem === undefined) {
        vscode.window.showInformationMessage("No item selected");
      } else {
        vscode.window.showInformationMessage(
          `${selectedItem.id} - ${selectedItem.label}`
        );
        let doc = vscode.window.activeTextEditor;

        let text = doc?.document.getText();
        let vars = variableLibraries.find(
          (o) => o.id === Number(selectedItem.id)
        )?.variables;

        console.log(vars);
        let replacements: Replacement = {};
        Object.keys(vars!).forEach((key) => {
          replacements[key] = vars![key].value;
        });

        const result = text?.replace(/#\{(.*?)\}#/g, (match, key) => {
          return replacements[key] || match; // If no replacement is found, return the original match
        });

        replaceFileContents(result!);
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
